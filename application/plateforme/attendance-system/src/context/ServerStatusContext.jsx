import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import api, { SERVER_URL } from "../services/api";

const ServerStatusContext = createContext(null);

export function ServerStatusProvider({ children }) {
  const [isServerDown, setIsServerDown] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(5);

  const isCheckingRef = useRef(false);

  const formatErrorDetails = (err) => {
    const timeStr = new Date().toLocaleTimeString();
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return `[${timeStr}] DÉLAI DÉPASSÉ (Timeout) : Le serveur (${SERVER_URL}) n'a pas répondu dans les temps.`;
    }
    if (!err.response) {
      return `[${timeStr}] ERREUR RÉSEAU (${err.code || "ERR_NETWORK"}) : Impossible d'établir une connexion avec le serveur (${SERVER_URL}). Le serveur backend est probablement éteint ou inaccessible.`;
    }
    return `[${timeStr}] ERREUR SERVEUR HTTP ${err.response.status} (${err.response.statusText || "Service Unavailable"}) sur ${err.config?.url || SERVER_URL}.`;
  };

  const checkServerHealth = useCallback(async (silent = false) => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    if (!silent) setIsChecking(true);

    try {
      // Ping health endpoint with short timeout
      await axios.get(`${SERVER_URL}/api/health`, {
        timeout: 3000,
        withCredentials: true,
      });

      setIsServerDown(false);
      setErrorDetails(null);
      setLastChecked(new Date());
      setCountdown(5);
      isCheckingRef.current = false;
      setIsChecking(false);
      return true;
    } catch (err) {
      setIsServerDown(true);
      setErrorDetails(formatErrorDetails(err));
      setLastChecked(new Date());
      isCheckingRef.current = false;
      setIsChecking(false);
      return false;
    }
  }, []);

  // Axios interceptor for global API calls
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const isNetworkError =
          !error.response ||
          error.code === "ERR_NETWORK" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ECONNABORTED";
        const isServerUnavailable = error.response && [502, 503, 504].includes(error.response.status);

        if (isNetworkError || isServerUnavailable) {
          setIsServerDown(true);
          setErrorDetails(formatErrorDetails(error));
          setLastChecked(new Date());
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Continuous background heartbeat & countdown timer
  useEffect(() => {
    let intervalId;

    if (isServerDown) {
      // When server is DOWN: countdown every 1s, ping when countdown reaching 0
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            checkServerHealth(true);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // When server is UP: ping every 5 seconds to detect if backend cuts off at any moment
      intervalId = setInterval(() => {
        checkServerHealth(true);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isServerDown, checkServerHealth]);

  // Initial check on mount
  useEffect(() => {
    checkServerHealth(true);
  }, [checkServerHealth]);

  return (
    <ServerStatusContext.Provider
      value={{
        isServerDown,
        isChecking,
        errorDetails,
        lastChecked,
        countdown,
        serverUrl: SERVER_URL,
        checkServerHealth,
        setIsServerDown,
      }}
    >
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error("useServerStatus must be used within a ServerStatusProvider");
  }
  return context;
}
