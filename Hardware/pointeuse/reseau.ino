String httpPostJSON(const char* path, String body) {
  if (!reseauDisponible()) {
    Serial.println("[HTTP] Reseau indisponible, requete POST annulee");
    return "";
  }

  Client* client = ethernetActif ? (Client*)&ethClient : (Client*)&wifiClient;
  client->stop(); // S'assurer que le socket precedent est bien ferme

  HttpClient http(*client, SERVER_HOST_NAME, SERVER_PORT);
  http.setHttpResponseTimeout(1000);
  http.setTimeout(1000);

  http.beginRequest();
  http.post(path);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("x-device-key", DEVICE_KEY);
  http.sendHeader("Content-Length", body.length());
  http.beginBody();
  http.print(body);
  http.endRequest();

  int code = http.responseStatusCode();
  String reponse = "";

  if (code > 0) {
    reponse = http.responseBody();
  } else {
    Serial.print("[HTTP POST] Erreur connexion code=");
    Serial.println(code);
  }

  http.stop();
  client->stop();
  return reponse;
}

String httpGetJSON(const char* path) {
  if (!reseauDisponible()) return "";

  Client* client = ethernetActif ? (Client*)&ethClient : (Client*)&wifiClient;
  client->stop();

  HttpClient http(*client, SERVER_HOST_NAME, SERVER_PORT);
  http.setHttpResponseTimeout(1000);
  http.setTimeout(1000);

  http.beginRequest();
  http.get(path);
  http.sendHeader("x-device-key", DEVICE_KEY);
  http.endRequest();

  int code = http.responseStatusCode();
  String reponse = "";

  if (code > 0) {
    reponse = http.responseBody();
  } else {
    Serial.print("[HTTP GET] Erreur connexion code=");
    Serial.println(code);
  }

  http.stop();
  client->stop();
  return reponse;
}

String envoyerMongo(int id, String action) {
  return envoyerMongo(id, action.c_str());
}

String envoyerMongo(int id, const char* action)
{
  String data = "{\"fingerID\":" + String(id) + ",\"action\":\"" + String(action) + "\"}";
  return httpPostJSON("/api/fingerprint", data);

}

void envoyerEnroll(uint8_t fingerId, String employeeId) {
  envoyerEnroll((int)fingerId, employeeId);
}

void envoyerEnroll(int fingerId, String employeeId) {
  String data = "{\"fingerID\":" + String(fingerId) + ",\"action\":\"enroll\",\"employeeId\":\"" + employeeId + "\"}";
  httpPostJSON("/api/fingerprint", data);
}

bool verifierPending() {
  String reponse = httpGetJSON("/api/fingerprint/pending");
  return reponse.indexOf("\"pending\":true") >= 0;
}

void verifierSuppressions() {
  String reponse = httpGetJSON("/api/fingerprint/pending-deletions");

  if (reponse.length() > 0) {

    int start = reponse.indexOf('[');
    int fin = reponse.indexOf(']');

    if (start >= 0 && fin > start) {
      String contenu = reponse.substring(start + 1, fin);
      contenu.trim();

      if (contenu.length() > 0) {
        int pos = 0;
        while (pos < contenu.length()) {
          int virgule = contenu.indexOf(',', pos);
          String morceau = (virgule == -1) ? contenu.substring(pos) : contenu.substring(pos, virgule);
          morceau.trim();

          int idASupprimer = morceau.toInt();
          uint8_t p = finger.deleteModel(idASupprimer);

          if (p == FINGERPRINT_OK) {
            Serial.print("Empreinte supprimee automatiquement, ID : ");
            Serial.println(idASupprimer);
          }

          if (virgule == -1) break;
          pos = virgule + 1;
        }
      }
    }
  } else {
    Serial.println("[Deletion] Requete echouee");
  }
}

bool recupererEmployesSansEmpreinte(const char* type) {
  String chemin = "/api/fingerprint/unassigned?type=" + String(type);
  String reponse = httpGetJSON(chemin.c_str());
  bool ok = false;

  if (reponse.length() > 0) {
    DynamicJsonDocument doc(2048);
    DeserializationError err = deserializeJson(doc, reponse);

    if (!err) {
      empCount = 0;
      for (JsonObject emp : doc.as<JsonArray>()) {
        if (empCount >= 8) break;
        empId[empCount]       = emp["id"].as<String>();
        empName[empCount]     = emp["name"].as<String>();
        empMatricule[empCount]= emp["matricule"].as<String>();
        empCount++;
      }
      ok = true;
    }
  }

  return ok;
}

void supprimerEmployeComplet() {
  int index = selectionnerEmploye("toutes");
  if (index < 0) return;

  String employeId = empId[index];
  String nom = empName[index];

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("CONFIRMATION", 2);
  texteCentre("Supprimer", 148, COULEUR_TEXTE, 2);
  texteCentre(nom, 172, COULEUR_ERREUR, 2);
  dessinerBarreAide("#=Confirmer   *=Annuler");

  unsigned long dernierFrame = 0;
  bool pulse = false;
  char touche = 0;

  while (touche != '#' && touche != '*') {
    if (millis() - dernierFrame > 400) {
      dernierFrame = millis();
      pulse = !pulse;
      dessinerAvertissement(tft.width() / 2, 95, 26, COULEUR_ERREUR, pulse);
    }
    touche = keypad.getKey();
  }

  if (touche == '*') {
    afficherMessage("Annule", ILI9341_YELLOW);
    delay(1200);
    return;
  }

  afficherMessage("Suppression...", ILI9341_WHITE);

  String data = "{\"action\":\"deleteEmployee\",\"employeeId\":\"" + employeId + "\"}";
  String reponse = httpPostJSON("/api/fingerprint", data);

  // Le serveur met les empreintes de l'employe en file d'attente ;
  // elles seront supprimees du capteur via verifierSuppressions().
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("SUPPRESSION", 2);

  if (reponse.length() > 0 && reponse.indexOf("\"error\"") == -1) {
    dessinerCorbeille(tft.width() / 2, 100, 38, COULEUR_SUCCES);
    texteCentre("Employe supprime", 165, COULEUR_SUCCES, 2);
  } else {
    dessinerCroix(tft.width() / 2, 100, 24);
    texteCentre("Erreur suppression", 165, COULEUR_ERREUR, 2);
  }

  delay(2000);
}

int selectionnerEmploye(String type) {
  return selectionnerEmploye(type.c_str());
}

int selectionnerEmploye(const char* type) {
  ecranAccueil = false;

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("RECHERCHE...", 2);
  texteCentre("Chargement", 120, COULEUR_TEXTE, 2);

  if (!recupererEmployesSansEmpreinte(type) || empCount == 0) {
    tft.fillScreen(COULEUR_FOND);
    dessinerEntete("SELECTION", 2);
    dessinerCroix(tft.width() / 2, 100, 24);
    texteCentre("Aucun employe", 155, COULEUR_ERREUR, 2);
    if (!(type=="has"))
    texteCentre("sans empreinte", 180, COULEUR_ERREUR, 2);
    else
    texteCentre("avec empreinte", 180, COULEUR_ERREUR, 2);
    delay(2000);
    return -1;
  }

  int curseur = 0;
  int fenetre = 4;
  bool redessiner = true;

  while (true) {
    if (redessiner) {
      tft.fillScreen(COULEUR_FOND);
      dessinerEntete("CHOISIR EMPLOYE", 2);

      int debut = curseur - (curseur % fenetre);
      int y = 44;
      int hauteurLigne = 42;

      for (int i = debut; i < min(debut + fenetre, empCount); i++) {
        bool selectionne = (i == curseur);

        if (selectionne) {
          tft.fillRoundRect(8, y, tft.width() - 16, hauteurLigne - 6, 8, COULEUR_CARTE);
          tft.drawRoundRect(8, y, tft.width() - 16, hauteurLigne - 6, 8, COULEUR_ACCENT);
          dessinerPersonne(28, y + (hauteurLigne - 6) / 2, 16, COULEUR_ACCENT);
        }

        int xTexte = selectionne ? 44 : 16;

        tft.setTextSize(2);
        tft.setTextColor(selectionne ? COULEUR_TEXTE : COULEUR_TEXTE_2);
        tft.setCursor(xTexte, y + 6);
        tft.println(empMatricule[i]);

        tft.setTextSize(1);
        tft.setTextColor(selectionne ? COULEUR_ACCENT : COULEUR_TEXTE_2);
        tft.setCursor(xTexte, y + 24);
        tft.println(empName[i]);

        y += hauteurLigne;
      }

      // Barre d'indication en bas
      String indication = String(curseur + 1) + "/" + String(empCount) + "  2=Haut 8=Bas #=OK *=Annuler";
      dessinerBarreAide(indication);

      redessiner = false;
    }

    char touche = keypad.getKey();

    if (touche == '2') {
      curseur = (curseur - 1 + empCount) % empCount;
      redessiner = true;
    } else if (touche == '8') {
      curseur = (curseur + 1) % empCount;
      redessiner = true;
    } else if (touche == '#') {
      return curseur;
    } else if (touche == '*') {
      return -1;
    }
  }
}

String saisirMatricule() {
  String saisie = "";

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("NOUVEL EMPLOYE", 2);
  dessinerBarreAide("#=Valider   *=Annuler   D=Effacer");

  while (true) {
    dessinerChampSaisie("Matricule", saisie, false, COULEUR_ACCENT);

    char touche = 0;
    while (!touche) touche = keypad.getKey();

    if (touche >= '0' && touche <= '9') {
      if (saisie.length() < 10) saisie += touche;
    } else if (touche == 'D') {
      if (saisie.length() > 0) saisie.remove(saisie.length() - 1);
    } else if (touche == '#') {
      if (saisie.length() > 0) return saisie;
    } else if (touche == '*') {
      return "";
    }
  }
}

bool creerEmployeRapide(String matricule, String &employeIdCree, String &nomCree, bool &dejaExistant) {
  String data = "{\"matricule\":\"" + matricule + "\"}";
  String reponse = httpPostJSON("/api/employees/quick", data);

  if (reponse.length() == 0) return false;

  DynamicJsonDocument doc(512);
  DeserializationError err = deserializeJson(doc, reponse);

  if (err || !doc.containsKey("_id")) return false;

  employeIdCree = doc["_id"].as<String>();
  nomCree = doc["name"].as<String>();
  dejaExistant = doc.containsKey("alreadyExisted") && doc["alreadyExisted"].as<bool>();
  return true;
}

bool creerEmployeRapide(String matricule, String &employeIdCree, String &nomCree) {
  bool dummy = false;
  return creerEmployeRapide(matricule, employeIdCree, nomCree, dummy);
}

bool demanderPin() {
  String saisie = "";

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("ACCES ADMIN", 2);
  dessinerBarreAide("#=Valider   *=Annuler   D=Effacer");

  while (true) {
    dessinerChampSaisie("Code PIN", saisie, true, COULEUR_ACCENT);

    char touche = 0;
    while (!touche) touche = keypad.getKey();

    if (touche >= '0' && touche <= '9') {
      if (saisie.length() < 8) saisie += touche;
    } else if (touche == 'D') {
      if (saisie.length() > 0) saisie.remove(saisie.length() - 1);
    } else if (touche == '#') {
      if (saisie.length() == 0) continue;

      if (!reseauDisponible()) {
        afficherMessage("Reseau hors-ligne !\nConnectez Ethernet", ILI9341_RED);
        delay(2500);
        return false;
      }

      afficherMessage("Verification...", ILI9341_WHITE);

      String data = "{\"pin\":\"" + saisie + "\",\"deviceId\":\"" + String(DEVICE_ID) + "\"}";
      String reponse = httpPostJSON("/api/fingerprint/verify-pin", data);

      if (reponse.indexOf("\"valid\":true") >= 0) {
        return true;
      } else if (reponse.indexOf("429") >= 0 || reponse.indexOf("Trop de tentatives") >= 0) {
        afficherMessage("Trop d'essais\n  Attendez 1 min", ILI9341_RED);
        delay(2000);
        return false;
      } else {
        afficherMessage("Code incorrect", ILI9341_RED);
        delay(1500);
        return demanderPin();
      }
    } else if (touche == '*') {
      return false;
    }
  }
}

extern bool configValideeWebPortal;

void sauvegarderParamsCallback() {
  configValideeWebPortal = true;
  Preferences prefs;
  prefs.begin("pointeuse", false);
  prefs.putBool("config_saved", true);

  if (WiFi.SSID().length() > 0) {
    strncpy(WIFI_CONFIG_SSID, WiFi.SSID().c_str(), sizeof(WIFI_CONFIG_SSID) - 1);
    prefs.putString("wifi_ssid", WIFI_CONFIG_SSID);
  }
  if (WiFi.psk().length() > 0) {
    strncpy(WIFI_CONFIG_PASS, WiFi.psk().c_str(), sizeof(WIFI_CONFIG_PASS) - 1);
    prefs.putString("wifi_pass", WIFI_CONFIG_PASS);
  }

  const char* valServer = custom_server_ip.getValue();
  if (valServer && strlen(valServer) > 0) {
    strncpy(SERVER_HOST_NAME, valServer, sizeof(SERVER_HOST_NAME) - 1);
    prefs.putString("server_ip", SERVER_HOST_NAME);
    Serial.print("[WebPortal] Nouvelle IP Serveur : ");
    Serial.println(SERVER_HOST_NAME);
  }

  const char* valPortalPass = custom_portal_pass.getValue();
  if (valPortalPass && strlen(valPortalPass) > 0) {
    strncpy(WEB_PORTAL_PASSWORD, valPortalPass, sizeof(WEB_PORTAL_PASSWORD) - 1);
    prefs.putString("portal_pass", WEB_PORTAL_PASSWORD);
  }

  const char* valEthIP = custom_eth_ip.getValue();
  if (valEthIP) {
    strncpy(ETH_STATIC_IP, valEthIP, sizeof(ETH_STATIC_IP) - 1);
    prefs.putString("eth_ip", ETH_STATIC_IP);
  }

  const char* valEthGW = custom_eth_gw.getValue();
  if (valEthGW) {
    strncpy(ETH_STATIC_GATEWAY, valEthGW, sizeof(ETH_STATIC_GATEWAY) - 1);
    prefs.putString("eth_gw", ETH_STATIC_GATEWAY);
  }

  const char* valEthSN = custom_eth_sn.getValue();
  if (valEthSN) {
    strncpy(ETH_STATIC_SUBNET, valEthSN, sizeof(ETH_STATIC_SUBNET) - 1);
    prefs.putString("eth_sn", ETH_STATIC_SUBNET);
  }

  const char* valEthDNS = custom_eth_dns.getValue();
  if (valEthDNS) {
    strncpy(ETH_STATIC_DNS, valEthDNS, sizeof(ETH_STATIC_DNS) - 1);
    prefs.putString("eth_dns", ETH_STATIC_DNS);
  }

  prefs.end();
  Serial.println("[WebPortal] Tous les parametres reseau (WiFi, Ethernet, Backend) ont ete sauvegardes !");

  if (Ethernet.linkStatus() == LinkON) {
    Serial.println("[WebPortal] Application immediate des nouveaux parametres Ethernet...");
    demarrerEthernet();
  }
}

EthernetServer ethServer(80);
bool ethServerDemarre = false;

void envoyerReponseHtmlEthernet(EthernetClient &client, const String &html, bool setCookie = false) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html; charset=utf-8");
  if (setCookie) {
    client.println("Set-Cookie: ESPSESSIONID=biopulse_authenticated_2026; Path=/");
  }
  client.println("Content-Length: " + String(html.length()));
  client.println("Connection: close");
  client.println();

  // Envoi par morceaux de 512 octets pour eviter la saturation/tronquage du buffer W5500 SPI
  int total = html.length();
  int offset = 0;
  while (offset < total) {
    int chunkSize = min(512, total - offset);
    client.write((const uint8_t*)(html.c_str() + offset), chunkSize);
    offset += chunkSize;
    delay(2);
  }
}

String genererPagePortailHTML() {
  String ipStr = ethernetActif && Ethernet.linkStatus() == LinkON ? Ethernet.localIP().toString() : WiFi.localIP().toString();

  String html = F("<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>BioPulse OS — Portail Cyber-Biométrique</title>"
    "<style>"
    "body { background: #060913 radial-gradient(circle at 50% 20%, rgba(2,132,199,0.2) 0%, transparent 60%) !important; color: #f8fafc !important; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important; padding: 20px 10px; margin: 0; min-height: 100vh; box-sizing: border-box; }"
    "div.wrap { max-width: 450px !important; margin: 0 auto !important; font-family: inherit !important; }"
    "button, a.btn-link { display:block !important; width: 100% !important; padding: 16px !important; margin-bottom: 15px !important; border-radius: 14px !important; border: none !important; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%) !important; color: #ffffff !important; font-weight: 800 !important; font-size: 15px !important; text-transform: uppercase !important; letter-spacing: 1px !important; text-align:center !important; text-decoration:none !important; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4) !important; transition: all 0.3s ease !important; box-sizing:border-box !important; }"
    "button:hover, a.btn-link:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(56, 189, 248, 0.55) !important; text-decoration:none !important; color:#fff !important; }"
    "hr { border:0; border-top:1px solid rgba(255,255,255,0.2); margin:20px 0; }"
    ".info-card { background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; padding: 16px; margin-top: 20px; font-size: 13px; font-weight: 600; text-align: left; }"
    "</style></head><body>"
    "<div class='wrap'>"
    "<div style='text-align:center;padding:20px 0 15px 0;'>"
    "<div style='display:inline-block;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg, #0284c7, #6366f1);box-shadow:0 0 25px rgba(56,189,248,0.5);line-height:54px;font-size:26px;color:#fff;'>&#128274;</div>"
    "<h2 style='color:#ffffff;margin:12px 0 4px 0;font-size:24px;font-weight:900;letter-spacing:-0.5px;'>BIOPULSE OS</h2>"
    "<div style='color:#38bdf8;font-size:11px;font-weight:800;letter-spacing:1.2px;'>PORTAIL CYBER-BIOMÉTRIQUE ESP32</div>"
    "<div style='background:rgba(2,132,199,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:10px;padding:10px;margin-top:12px;color:#34d399;font-size:11px;'>&#9888; Note OTA : Seuls les fichiers compilés <b>.bin</b> sont acceptés. (Croquis > Exporter les binaire compilés)</div>"
    "</div>"
    "<div style='text-align:center;margin-bottom:20px;'>"
    "<h3 style='color:#ffffff;margin:0;font-size:18px;font-weight:800;'>BioPulse OS — Portail Cyber-Biométrique</h3>"
    "<div style='color:#38bdf8;font-size:13px;font-weight:700;margin-top:4px;'>esp32-CA7560 - ");
  html += ipStr;
  html += F("</div></div>"
    "<div>"
    "<a class='btn-link' href='/param'>CONFIGURE PARAMETERS</a>"
    "<a class='btn-link' href='/info'>INFO</a>"
    "<a class='btn-link' href='/'>EXIT</a>"
    "<hr>"
    "<a class='btn-link' href='/param'>UPDATE</a>"
    "</div>"
    "<div class='info-card'>"
    "<span style='color:#38bdf8;'>Connected to ");

  if (ethernetActif && Ethernet.linkStatus() == LinkON) {
    html += F("Ethernet Network</span><br><span style='color:#34d399;font-size:11px;'>with IP ");
  } else {
    html += F("WiFi Network</span><br><span style='color:#34d399;font-size:11px;'>with IP ");
  }
  html += ipStr;
  html += F("</span></div></div></body></html>");

  return html;
}

String genererPageParamHTML() {
  int n = WiFi.scanNetworks(false, false);
  String wifiOptions = F("<label>Réseaux Wi-Fi Détectés à proximité</label>"
                         "<select onchange='document.getElementById(\"wifi_ssid_input\").value = this.value;'>"
                         "<option value=''>-- ");
  wifiOptions += String(n) + F(" réseaux trouvés (Cliquez pour sélectionner) --</option>");

  for (int i = 0; i < n; ++i) {
    String ssidScanne = WiFi.SSID(i);
    if (ssidScanne.length() == 0) continue;
    int32_t rssi = WiFi.RSSI(i);
    int quality = (rssi <= -100) ? 0 : ((rssi >= -50) ? 100 : (2 * (rssi + 100)));
    String sec = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Ouvert" : "Sécurisé";
    String isSel = (ssidScanne == String(WIFI_CONFIG_SSID)) ? " selected" : "";
    wifiOptions += "<option value='" + ssidScanne + "'" + isSel + ">" + ssidScanne + " (" + String(quality) + "% - " + sec + ")</option>";
  }
  wifiOptions += F("</select>");
  WiFi.scanDelete();

  String html = F("<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>BioPulse OS — Paramètres</title>"
    "<style>"
    "body { background: #060913 radial-gradient(circle at 50% 20%, rgba(2,132,199,0.2) 0%, transparent 60%) !important; color: #f8fafc !important; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important; padding: 20px 10px; margin: 0; min-height: 100vh; box-sizing: border-box; }"
    "div.wrap { max-width: 450px !important; margin: 0 auto !important; font-family: inherit !important; }"
    ".q { background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%) !important; border: 1px solid rgba(56, 189, 248, 0.35) !important; border-radius: 20px !important; padding: 24px !important; box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 25px rgba(2,132,199,0.2) !important; margin-bottom: 20px !important; }"
    "label { color: #38bdf8 !important; font-weight: 800 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; display: block !important; margin-top: 14px !important; margin-bottom: 4px !important; }"
    "input, select { width: 100% !important; padding: 13px 16px !important; margin-bottom: 12px !important; border-radius: 12px !important; border: 1px solid rgba(56, 189, 248, 0.3) !important; background-color: #0f172a !important; color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important; box-sizing: border-box !important; outline: none !important; transition: all 0.25s ease !important; display:block !important; }"
    "input:focus, select:focus { border-color: #38bdf8 !important; box-shadow: 0 0 14px rgba(56, 189, 248, 0.4) !important; background-color: #1e293b !important; }"
    "button, input[type='submit'] { width: 100% !important; padding: 14px !important; margin-top: 20px !important; border-radius: 14px !important; border: none !important; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%) !important; color: #ffffff !important; font-weight: 800 !important; font-size: 15px !important; text-transform: uppercase !important; letter-spacing: 1px !important; cursor: pointer !important; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4) !important; transition: all 0.3s ease !important; display:block !important; }"
    "button:hover, input[type='submit']:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(56, 189, 248, 0.55) !important; }"
    "a.back { color: #38bdf8 !important; text-decoration: none !important; font-weight: 700 !important; display: inline-block !important; margin-top: 15px !important; text-align: center !important; width: 100% !important; }"
    "</style></head><body>"
    "<div class='wrap'>"
    "<div style='text-align:center;padding:20px 0 15px 0;'>"
    "<div style='display:inline-block;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg, #0284c7, #6366f1);box-shadow:0 0 25px rgba(56,189,248,0.5);line-height:54px;font-size:26px;color:#fff;'>&#128274;</div>"
    "<h2 style='color:#ffffff;margin:12px 0 4px 0;font-size:24px;font-weight:900;letter-spacing:-0.5px;'>BIOPULSE OS</h2>"
    "<div style='color:#38bdf8;font-size:11px;font-weight:800;letter-spacing:1.2px;'>PORTAIL CYBER-BIOMÉTRIQUE ESP32</div>"
    "</div>"
    "<div class='q'>"
    "<form method='POST' action='/save'>"
    "<label>IP du Serveur Backend</label>"
    "<input type='text' name='server_ip' value='");
  html += String(SERVER_HOST_NAME);
  html += F("' placeholder='ex: 192.168.1.100' required />"
    "<label>Mot de Passe Admin Portail</label>"
    "<input type='password' name='portal_pass' value='");
  html += String(WEB_PORTAL_PASSWORD);
  html += F("' placeholder='Nouveau mot de passe' required />");

  html += wifiOptions;

  html += F("<label>Nom du Réseau Wi-Fi (SSID)</label>"
    "<input type='text' id='wifi_ssid_input' name='wifi_ssid' value='");
  html += String(WIFI_CONFIG_SSID);
  html += F("' placeholder='ex: MonReseauWiFi' />"
    "<label>Mot de Passe Wi-Fi</label>"
    "<input type='password' name='wifi_pass' value='");
  html += String(WIFI_CONFIG_PASS);
  html += F("' placeholder='Mot de passe Wi-Fi' />"
    "<label>IP Statique ESP32 (vide = DHCP)</label>"
    "<input type='text' name='eth_ip' value='");
  html += String(ETH_STATIC_IP);
  html += F("' placeholder='ex: 192.168.1.50' />"
    "<label>Passerelle (Gateway)</label>"
    "<input type='text' name='eth_gw' value='");
  html += String(ETH_STATIC_GATEWAY);
  html += F("' placeholder='ex: 192.168.1.1' />"
    "<label>Masque (Subnet)</label>"
    "<input type='text' name='eth_sn' value='");
  html += String(ETH_STATIC_SUBNET);
  html += F("' placeholder='ex: 255.255.255.0' />"
    "<label>Serveur DNS</label>"
    "<input type='text' name='eth_dns' value='");
  html += String(ETH_STATIC_DNS);
  html += F("' placeholder='ex: 8.8.8.8' />"
    "<button type='submit'>ENREGISTRER LA CONFIGURATION</button>"
    "</form></div>"
    "<a class='back' href='/'>&larr; Retour au Menu principal</a>"
    "</div></body></html>");

  return html;
}

String genererPageInfoHTML() {
  String html = F("<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>BioPulse OS — Information</title>"
    "<style>"
    "body { background: #060913 radial-gradient(circle at 50% 20%, rgba(2,132,199,0.2) 0%, transparent 60%) !important; color: #f8fafc !important; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important; padding: 20px 10px; margin: 0; min-height: 100vh; box-sizing: border-box; }"
    "div.wrap { max-width: 450px !important; margin: 0 auto !important; font-family: inherit !important; }"
    ".q { background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%) !important; border: 1px solid rgba(56, 189, 248, 0.35) !important; border-radius: 20px !important; padding: 24px !important; box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 25px rgba(2,132,199,0.2) !important; margin-bottom: 20px !important; }"
    "a.back { color: #38bdf8 !important; text-decoration: none !important; font-weight: 700 !important; display: inline-block !important; margin-top: 15px !important; text-align: center !important; width: 100% !important; }"
    "table { width:100%; border-collapse:collapse; font-size:13px; margin-top:10px; }"
    "td { padding:8px 4px; border-bottom:1px solid rgba(255,255,255,0.1); }"
    "td.lbl { color:#38bdf8; font-weight:700; }"
    "</style></head><body>"
    "<div class='wrap'>"
    "<div style='text-align:center;padding:20px 0 15px 0;'>"
    "<div style='display:inline-block;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg, #0284c7, #6366f1);box-shadow:0 0 25px rgba(56,189,248,0.5);line-height:54px;font-size:26px;color:#fff;'>&#128274;</div>"
    "<h2 style='color:#ffffff;margin:12px 0 4px 0;font-size:24px;font-weight:900;letter-spacing:-0.5px;'>BIOPULSE OS</h2>"
    "<div style='color:#38bdf8;font-size:11px;font-weight:800;letter-spacing:1.2px;'>INFORMATION SYSTÈME</div>"
    "</div>"
    "<div class='q'><table>"
    "<tr><td class='lbl'>Module ESP32</td><td>BioPulse OS v2.0</td></tr>"
    "<tr><td class='lbl'>IP Ethernet</td><td>");
  html += Ethernet.localIP().toString();
  html += F("</td></tr><tr><td class='lbl'>IP Wi-Fi</td><td>");
  html += WiFi.localIP().toString();
  html += F("</td></tr><tr><td class='lbl'>Serveur Backend</td><td>");
  html += String(SERVER_HOST_NAME);
  html += F("</td></tr><tr><td class='lbl'>Free RAM</td><td>");
  html += String(ESP.getFreeHeap()) + " octets";
  html += F("</td></tr></table></div>"
    "<a class='back' href='/'>&larr; Retour au Menu principal</a>"
    "</div></body></html>");

  return html;
}

void gererServeurWebEthernet() {
  if (!ethernetActif || Ethernet.linkStatus() != LinkON) return;

  if (!ethServerDemarre) {
    ethServer.begin();
    ethServerDemarre = true;
    Serial.println("[EthernetServer] Serveur Web Ethernet demarre sur le port 80 (IP: " + Ethernet.localIP().toString() + ")");
  }

  EthernetClient client = ethServer.available();
  if (!client) return;

  String line1 = "";
  String body = "";
  bool estPost = false;
  bool estCookieAuth = false;
  int contentLength = 0;
  bool line1Captured = false;

  unsigned long timeout = millis() + 800;
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      String line = client.readStringUntil('\n');
      line.trim();

      if (!line1Captured) {
        line1 = line;
        line1Captured = true;
      }

      String lineLower = line;
      lineLower.toLowerCase();

      if (lineLower.indexOf("espsessionid=biopulse_authenticated_2026") >= 0) {
        estCookieAuth = true;
      }

      if (lineLower.startsWith("content-length:")) {
        contentLength = line.substring(15).toInt();
      }

      if (line.length() == 0) {
        if (line1.startsWith("POST")) {
          estPost = true;
          unsigned long bodyTimeout = millis() + 400;
          while (body.length() < contentLength && millis() < bodyTimeout) {
            while (client.available()) {
              char c = (char)client.read();
              body += c;
            }
            yield();
          }
        }
        break;
      }
    } else {
      yield();
    }
  }

  if (line1.length() == 0) {
    client.stop();
    return;
  }

  if (line1.indexOf("/login") >= 0) {
    if (estPost) {
      String passSubmitted = "";
      int idx = body.indexOf("password=");
      if (idx >= 0) {
        passSubmitted = body.substring(idx + 9);
        int ampersand = passSubmitted.indexOf('&');
        if (ampersand >= 0) passSubmitted = passSubmitted.substring(0, ampersand);
        passSubmitted.replace("+", " ");
        passSubmitted.replace("%3A", ":");
        passSubmitted.replace("%2F", "/");
        passSubmitted.trim();
      }

      if (passSubmitted == String(WEB_PORTAL_PASSWORD)) {
        envoyerReponseHtmlEthernet(client, genererPagePortailHTML(), true);
      } else {
        envoyerReponseHtmlEthernet(client, genererPageLoginHTML(true), false);
      }
    } else {
      envoyerReponseHtmlEthernet(client, genererPageLoginHTML(false), false);
    }
  } else if (line1.indexOf("/param") >= 0) {
    if (!estCookieAuth) {
      envoyerReponseHtmlEthernet(client, genererPageLoginHTML(false), false);
    } else {
      envoyerReponseHtmlEthernet(client, genererPageParamHTML(), false);
    }
  } else if (line1.indexOf("/info") >= 0) {
    if (!estCookieAuth) {
      envoyerReponseHtmlEthernet(client, genererPageLoginHTML(false), false);
    } else {
      envoyerReponseHtmlEthernet(client, genererPageInfoHTML(), false);
    }
  } else if (line1.indexOf("/save") >= 0 && estPost) {
    if (!estCookieAuth) {
      envoyerReponseHtmlEthernet(client, genererPageLoginHTML(false), false);
    } else {
      auto getArgVal = [&](String key) -> String {
        int pos = body.indexOf(key + "=");
        if (pos < 0) return "";
        String val = body.substring(pos + key.length() + 1);
        int endPos = val.indexOf('&');
        if (endPos >= 0) val = val.substring(0, endPos);
        val.replace("+", " ");
        val.replace("%3A", ":");
        val.replace("%2F", "/");
        return val;
      };

      String sIP = getArgVal("server_ip");
      String pPass = getArgVal("portal_pass");
      String wSSID = getArgVal("wifi_ssid");
      String wPass = getArgVal("wifi_pass");
      String eIP = getArgVal("eth_ip");
      String eGW = getArgVal("eth_gw");
      String eSN = getArgVal("eth_sn");
      String eDNS = getArgVal("eth_dns");

      Preferences prefs;
      prefs.begin("pointeuse", false);
      prefs.putBool("config_saved", true);

      if (sIP.length() > 0) {
        strncpy(SERVER_HOST_NAME, sIP.c_str(), sizeof(SERVER_HOST_NAME) - 1);
        prefs.putString("server_ip", SERVER_HOST_NAME);
      }
      if (pPass.length() > 0) {
        strncpy(WEB_PORTAL_PASSWORD, pPass.c_str(), sizeof(WEB_PORTAL_PASSWORD) - 1);
        prefs.putString("portal_pass", WEB_PORTAL_PASSWORD);
      }
      if (wSSID.length() > 0) {
        strncpy(WIFI_CONFIG_SSID, wSSID.c_str(), sizeof(WIFI_CONFIG_SSID) - 1);
        prefs.putString("wifi_ssid", WIFI_CONFIG_SSID);
      }
      if (wPass.length() > 0) {
        strncpy(WIFI_CONFIG_PASS, wPass.c_str(), sizeof(WIFI_CONFIG_PASS) - 1);
        prefs.putString("wifi_pass", WIFI_CONFIG_PASS);
      }
      strncpy(ETH_STATIC_IP, eIP.c_str(), sizeof(ETH_STATIC_IP) - 1);
      prefs.putString("eth_ip", ETH_STATIC_IP);

      strncpy(ETH_STATIC_GATEWAY, eGW.c_str(), sizeof(ETH_STATIC_GATEWAY) - 1);
      prefs.putString("eth_gw", ETH_STATIC_GATEWAY);

      strncpy(ETH_STATIC_SUBNET, eSN.c_str(), sizeof(ETH_STATIC_SUBNET) - 1);
      prefs.putString("eth_sn", ETH_STATIC_SUBNET);

      strncpy(ETH_STATIC_DNS, eDNS.c_str(), sizeof(ETH_STATIC_DNS) - 1);
      prefs.putString("eth_dns", ETH_STATIC_DNS);

      prefs.end();

      String okPage = F("<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'>"
        "<title>BioPulse OS</title><style>body{background:#090d16;color:#34d399;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}</style></head>"
        "<body><div><h2>&#10004; Configuration Enregistrée !</h2><p style='color:#94a3b8;'>Redémarrage de la pointeuse en cours...</p></div></body></html>");
      envoyerReponseHtmlEthernet(client, okPage, false);

      delay(1500);
      ESP.restart();
    }
  } else {
    if (estCookieAuth) {
      envoyerReponseHtmlEthernet(client, genererPagePortailHTML(), false);
    } else {
      envoyerReponseHtmlEthernet(client, genererPageLoginHTML(false), false);
    }
  }

  delay(1);
  client.stop();
}

extern bool portailActif;

void reconfigurerWiFi() {
  portailActif = true;
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("PORTAIL DE CONFIGURATION", 1);

  texteCentre("1. Connectez au WiFi :", 46, COULEUR_TEXTE_2, 1);
  texteCentre("Pointeuse-Config", 62, COULEUR_ACCENT, 2);

  texteCentre("2. Dans votre navigateur, ouvrez :", 90, COULEUR_TEXTE_2, 1);
  texteCentre("http://192.168.4.1", 108, COULEUR_SUCCES, 2);

  // Affichage de l'adresse IP active de la carte (Ethernet ou Wi-Fi STA)
  String ipCarte = "";
  if (ethernetActif && Ethernet.linkStatus() == LinkON) {
    ipCarte = "IP ETH : " + Ethernet.localIP().toString();
  } else if (WiFi.status() == WL_CONNECTED) {
    ipCarte = "IP WiFi : " + WiFi.localIP().toString();
  }

  if (ipCarte.length() > 0) {
    texteCentre("ou via l'IP reseau : " + ipCarte, 134, COULEUR_ACCENT, 1);
    texteCentre("3. Enregistrez la config sur le web", 158, COULEUR_TEXTE_2, 1);
  } else {
    texteCentre("3. Enregistrez la config sur le web", 136, COULEUR_TEXTE_2, 1);
  }

  dessinerBarreAide("*=Quitter / Retour");

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("Pointeuse-Config", "12345678");
  wm.setConfigPortalTimeout(0);
  wm.setCaptivePortalEnable(false);
  wm.startWebPortal();

  configValideeWebPortal = false;
  while (!configValideeWebPortal) {
    wm.process();
    gererServeurWebEthernet();
    char k = keypad.getKey();
    if (k == '*') break;
    yield();
    delay(10);
  }

  portailActif = false;

  if (configValideeWebPortal) {
    afficherMessage("Config Enregistree !\nRedemarrage en cours...", ILI9341_GREEN);
    delay(1500);
    ESP.restart();
  }
}

bool reseauDisponible() {
  if (ethernetActif) {
    return (Ethernet.linkStatus() == LinkON && Ethernet.localIP() != IPAddress(0, 0, 0, 0));
  }
  return (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0));
}

bool w5500Initialise = false;

unsigned long dernierVerifBascule = 0;
const unsigned long INTERVALLE_VERIF_BASCULE = 300; // Verification ultra-rapide toutes les 300ms
unsigned long debutTransitionWiFi = 0;

void connecterWiFiSTA() {
  String ssid = strlen(WIFI_CONFIG_SSID) > 0 ? String(WIFI_CONFIG_SSID) : WiFi.SSID();
  String pass = strlen(WIFI_CONFIG_PASS) > 0 ? String(WIFI_CONFIG_PASS) : WiFi.psk();

  ssid.trim();
  pass.trim();

  Serial.println("\n--------------------------------------------------");
  Serial.println("[ETAPE 1/5] Lecture des identifiants Wi-Fi...");
  Serial.println("  --> Nom du réseau (SSID) : '" + ssid + "' (Longueur: " + String(ssid.length()) + " car)");
  Serial.println("  --> Mot de passe Wi-Fi    : " + (pass.length() > 0 ? "***** (" + String(pass.length()) + " car)" : "(aucun)"));

  Serial.println("[ETAPE 2/5] Activation du mode hybride WIFI_AP_STA");
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("Pointeuse-Config", "12345678");

  if (ssid.length() > 0) {
    Serial.println("[ETAPE 3/5] Lancement de la demande de connexion vers '" + ssid + "'...");
    if (pass.length() > 0) {
      WiFi.begin(ssid.c_str(), pass.c_str());
    } else {
      WiFi.begin(ssid.c_str());
    }
    Serial.println("  --> Commande WiFi.begin('" + ssid + "') envoyee avec succes.");
  } else {
    Serial.println("[ETAPE 3/5] ATTENTION : Aucun SSID n'est enregistre (SSID vide) !");
    WiFi.begin();
  }
  Serial.println("--------------------------------------------------\n");
  Serial.flush();
}

void verifierBasculeReseau() {
  static bool ancienEtatComplet = false;
  static bool ancienEthernetActif = false;
  static bool ancienWifiConnecte = false;
  static unsigned long dernierLogPollWifi = 0;

  if (millis() - dernierVerifBascule < INTERVALLE_VERIF_BASCULE) return;
  dernierVerifBascule = millis();

  // Log de polling serie toutes les 2s quand Ethernet est inactif et WiFi non connecte
  if (!ethernetActif && WiFi.status() != WL_CONNECTED && (millis() - dernierLogPollWifi > 2000)) {
    dernierLogPollWifi = millis();
    Serial.println("[WiFi POLLING] Statut Wi-Fi (" + String((int)WiFi.status()) + ") - SSID: '" + WiFi.SSID() + "' - IP: " + WiFi.localIP().toString());
    Serial.flush();
  }

  bool ethDisponible = (Ethernet.linkStatus() == LinkON);

  if (ethDisponible && !ethernetActif) {
    if (demarrerEthernet()) {
      ethernetActif = true;
      Serial.println("[Bascule DIAG] Basculement rapide vers ETHERNET reussi (IP: " + Ethernet.localIP().toString() + ")");
      Serial.flush();
    }
  } else if (!ethDisponible && ethernetActif) {
    ethernetActif = false;
    debutTransitionWiFi = millis();
    Serial.println("[Bascule DIAG] Cable Ethernet debranche -> Activation du WI-FI STA");
    Serial.flush();
    connecterWiFiSTA();
  }

  // Mettre a jour l'en-tete immediatement et sans scintillement si le mode reseau change
  if (ethernetActif != ancienEthernetActif || (WiFi.status() == WL_CONNECTED) != ancienWifiConnecte) {
    ancienEthernetActif = ethernetActif;
    ancienWifiConnecte = (WiFi.status() == WL_CONNECTED);
    Serial.println("[Bascule DIAG] Changement d'etat reseau detecte : EthernetActif=" + String(ethernetActif) + " WiFiStatus=" + String((int)WiFi.status()));
    Serial.flush();
    if (ecranAccueil && !ecranErreurActif) {
      afficherStatutConnexion();
    }
  }

  bool enTransition = (debutTransitionWiFi > 0 && millis() - debutTransitionWiFi < 3000);
  bool toutOk = reseauDisponible() && testerConnexionServeur();

  if (!ancienEtatComplet && toutOk) {
    ecranErreurActif = false;
    synchroniserHeure();
    afficherAccueil();
    debutTransitionWiFi = 0;
  } else if (ancienEtatComplet && !toutOk && !enTransition) {
    if (!ethernetActif && WiFi.status() != WL_CONNECTED) {
      Serial.println("[Bascule DIAG] WiFi non connecte pendant la perte de serveur -> Relance connecterWiFiSTA()");
      Serial.flush();
      connecterWiFiSTA();
    }
    ecranErreurActif = true;
  }

  ancienEtatComplet = toutOk;
}

bool synchroniserHeure() {
  String reponse = httpGetJSON("/api/fingerprint/time");
  if (reponse.length() > 0 && reponse.indexOf("\"epoch\"") >= 0) {
    DynamicJsonDocument doc(256);
    DeserializationError err = deserializeJson(doc, reponse);
    if (!err && doc.containsKey("epoch")) {
      unsigned long epochServeur = doc["epoch"].as<unsigned long>();
      decalageEpoch = (epochServeur + 3600) - (millis() / 1000); // UTC+1
      heureInitialisee = true;
      Serial.println("[Heure] Synchronise avec le serveur : epoch=" + String(epochServeur));
      return true;
    }
  }
  Serial.println("[Heure] Serveur injoignable - heure non mise a jour");
  return false;
}

bool obtenirHeureActuelle(struct tm &infoTemps) {
  if (!heureInitialisee) return false;

  time_t epochActuel = decalageEpoch + (millis() / 1000);
  infoTemps = *localtime(&epochActuel);
  return true;
}

bool decouvrirServeurUDP() {
  if (!reseauDisponible()) return false;

  if (strlen(SERVER_HOST_NAME) > 0) {
    return false;
  }

  UDP& udpClient = ethernetActif ? (UDP&)ntpUDPEthernet : (UDP&)ntpUDPWifi;
  udpClient.begin(5001);

  IPAddress broadcastIP(255, 255, 255, 255);
  udpClient.beginPacket(broadcastIP, 5001);
  udpClient.write((const uint8_t*)"DISCOVER_POINTEUSE_SERVER", 25);
  udpClient.endPacket();

  unsigned long start = millis();
  while (millis() - start < 1500) {
    int packetSize = udpClient.parsePacket();
    if (packetSize) {
      IPAddress remoteIP = udpClient.remoteIP();
      char response[64];
      int len = udpClient.read(response, sizeof(response) - 1);
      if (len > 0) response[len] = 0;

      if (String(response).indexOf("POINTEUSE_SERVER_HERE") >= 0) {
        String ipStr = remoteIP.toString();
        ipStr.toCharArray(SERVER_HOST_NAME, sizeof(SERVER_HOST_NAME));
        Serial.print("Serveur auto-detecte via UDP : ");
        Serial.println(SERVER_HOST_NAME);
        Preferences prefs;
        prefs.begin("pointeuse", false);
        prefs.putString("server_ip", SERVER_HOST_NAME);
        prefs.end();
        udpClient.stop();
        return true;
      }
    }
    delay(50);
  }
  udpClient.stop();
  return false;
}

bool demarrerEthernet() {
  digitalWrite(TFT_CS, HIGH);
  delayMicroseconds(10);

  if (!w5500Initialise) {
    afficherEcranConnexionEthernet();

    bool hardwareOk = false;
    for (int i = 0; i < 10; i++) {
      delay(100);
      SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
      digitalWrite(ETH_CS, LOW);
      delayMicroseconds(10);
      SPI.transfer(0x00);
      SPI.transfer(0x39);
      SPI.transfer(0x00);
      uint8_t version = SPI.transfer(0x00);
      digitalWrite(ETH_CS, HIGH);
      SPI.endTransaction();

      mettreAJourBarreProgression((i + 1) * 2, 20);

      if (version == 0x04) {
        hardwareOk = true;
        w5500Initialise = true;
        Serial.println("[Ethernet] W5500 detecte et initialise !");
        break;
      }
    }

    if (!hardwareOk) {
      Serial.println("[Ethernet] W5500 non detecte.");
      return false;
    }
  }

  if (Ethernet.linkStatus() != LinkON) {
    return false;
  }

  byte mac[6];
  WiFi.macAddress(mac);
  mac[5] ^= 0x01;

  IPAddress staticIP, staticGW, staticSN, staticDNS;
  bool estStatique = staticIP.fromString(ETH_STATIC_IP) && staticIP != IPAddress(0, 0, 0, 0);

  if (estStatique) {
    staticGW.fromString(ETH_STATIC_GATEWAY);
    staticSN.fromString(ETH_STATIC_SUBNET);
    staticDNS.fromString(ETH_STATIC_DNS);
    Serial.print("[Ethernet] Config IP Statique immediate : ");
    Serial.println(ETH_STATIC_IP);
    Ethernet.begin(mac, staticIP, staticDNS, staticGW, staticSN);
  } else {
    Serial.println("[Ethernet] DHCP rapide (timeout 2500ms)...");
    int dhcpResult = Ethernet.begin(mac, 2500, 1000);
    if (dhcpResult == 0) {
      Serial.println("[Ethernet] Echec DHCP Ethernet.");
      return false;
    }
    Serial.println("[Ethernet] IP DHCP obtenue : " + Ethernet.localIP().toString());
  }

  return (Ethernet.localIP() != IPAddress(0, 0, 0, 0));
}

bool testerConnexionServeur() {
  if (!reseauDisponible()) return false;
  String reponse = httpGetJSON("/api/fingerprint/time");
  return (reponse.length() > 0);
}



enum ModeEtatReseau {
  MODE_RESEAU_OK,
  MODE_ERREUR_RESEAU,
  MODE_ERREUR_SERVEUR
};

ModeEtatReseau etatReseauActuel = MODE_RESEAU_OK;

void attendreReseauEtServeur() {
  ledConnexion(true);

  // Lancer immediatement la tentative de connexion WiFi STA si Ethernet est inactif
  if (!ethernetActif && WiFi.status() != WL_CONNECTED) {
    Serial.println("[CONNEXION] Ethernet inactif -> Lancement connexion Wi-Fi au demarrage...");
    connecterWiFiSTA();
  }

  unsigned long debutGrace = millis();
  unsigned long dernierEssaiWiFiGrace = millis();

  while (millis() - debutGrace < 8000) {
    if (!ethernetActif && WiFi.status() != WL_CONNECTED && (millis() - dernierEssaiWiFiGrace > 3000)) {
      dernierEssaiWiFiGrace = millis();
      Serial.println("[CONNEXION] Relance connexion Wi-Fi pendant la periode de grace...");
      connecterWiFiSTA();
    }

    if (reseauDisponible() && testerConnexionServeur()) {
      etatReseauActuel = MODE_RESEAU_OK;
      ecranErreurActif = false;
      ledConnexion(false);
      return;
    }
    wm.process();
    gererServeurWebEthernet();
    delay(250);
  }

  ecranErreurActif = true;
  ecranAccueil = false;
  ModeEtatReseau dernierEtatAffiche = MODE_RESEAU_OK;
  unsigned long dernierEssaiConnect = 0;
  const unsigned long INTERVALLE_ESSAI = 3000;

  Serial.println("[CONNEXION] Erreur persisante - affichage ecran d'erreur...");

  while (true) {
    wm.process();
    gererServeurWebEthernet();
    verifierBasculeReseau();

    unsigned long maintenant = millis();
    bool netOk = reseauDisponible();
    ModeEtatReseau nouvelEtat = netOk ? MODE_ERREUR_SERVEUR : MODE_ERREUR_RESEAU;

    if (netOk && (maintenant - dernierEssaiConnect > INTERVALLE_ESSAI)) {
      dernierEssaiConnect = maintenant;
      if (testerConnexionServeur()) nouvelEtat = MODE_RESEAU_OK;
    }

    // Redessiner si l'etat change OU si quelque chose a ecrase notre ecran
    bool ecranEcrase = (ecranAccueil || (nouvelEtat == dernierEtatAffiche
                        && nouvelEtat != MODE_RESEAU_OK && millis() % 10000 < 20));
    if (nouvelEtat != dernierEtatAffiche || ecranEcrase) {
      dernierEtatAffiche = nouvelEtat;
      etatReseauActuel = nouvelEtat;
      ecranAccueil = false;

      if (nouvelEtat == MODE_ERREUR_RESEAU) {
        afficherEcranErreurReseau("ERREUR RESEAU",
          "Connexion Ethernet ou WiFi absente. Verifiez le cable ou le signal.");
      } else if (nouvelEtat == MODE_ERREUR_SERVEUR) {
        decouvrirServeurUDP();
        afficherEcranErreurReseau("SERVEUR INDISPONIBLE",
          "Serveur backend (" + String(SERVER_HOST_NAME) + ":" + String(SERVER_PORT) + ") injoignable.");
      } else {
        // RESOLU
        ecranErreurActif = false;
        synchroniserHeure();
        afficherAccueil();
        break;
      }
    }

    char key = keypad.getKey();
    if (key == '*') {
      afficherMessage("Verification...", ILI9341_WHITE);
      delay(400);
      if (reseauDisponible() && testerConnexionServeur()) {
        ecranErreurActif = false;
        synchroniserHeure();
        afficherAccueil();
        break;
      } else {
        dernierEtatAffiche = MODE_RESEAU_OK; // Force redraw
      }
    } else if (key == '#') {
      reconfigurerWiFi();
      dernierEtatAffiche = MODE_RESEAU_OK;
    }

    yield();
    delay(1);
  }

  etatReseauActuel = MODE_RESEAU_OK;
}

// Verification serveur en continu (a appeler dans loop() toutes les 5s).
void verifierServeurEnContinu() {
  static unsigned long dernierCheck = 0;
  const unsigned long INTERVALLE = 5000;
  if (millis() - dernierCheck < INTERVALLE) return;
  dernierCheck = millis();

  // Ignorer pendant la transition de 5s post-deconnexion Ethernet
  if (debutTransitionWiFi > 0 && millis() - debutTransitionWiFi < 5000) {
    return;
  }

  if (!reseauDisponible() || !testerConnexionServeur()) {
    attendreReseauEtServeur();
  }
}


void chargerParametresNVS() {
  Preferences prefs;
  prefs.begin("pointeuse", true);

  String sIP = prefs.getString("server_ip", "");
  if (sIP.length() > 0) {
    memset(SERVER_HOST_NAME, 0, sizeof(SERVER_HOST_NAME));
    strncpy(SERVER_HOST_NAME, sIP.c_str(), sizeof(SERVER_HOST_NAME) - 1);
    SERVER_HOST_NAME[sizeof(SERVER_HOST_NAME) - 1] = '\0';
    Serial.print("[NVS] IP Serveur Backend chargee : ");
    Serial.println(SERVER_HOST_NAME);
  }

  String ethIP = prefs.getString("eth_ip", "");
  if (ethIP.length() > 0) {
    memset(ETH_STATIC_IP, 0, sizeof(ETH_STATIC_IP));
    strncpy(ETH_STATIC_IP, ethIP.c_str(), sizeof(ETH_STATIC_IP) - 1);
    ETH_STATIC_IP[sizeof(ETH_STATIC_IP) - 1] = '\0';
    Serial.print("[NVS] IP Statique Ethernet chargee : ");
    Serial.println(ETH_STATIC_IP);
  }

  String ethGW = prefs.getString("eth_gw", "");
  if (ethGW.length() > 0) {
    memset(ETH_STATIC_GATEWAY, 0, sizeof(ETH_STATIC_GATEWAY));
    strncpy(ETH_STATIC_GATEWAY, ethGW.c_str(), sizeof(ETH_STATIC_GATEWAY) - 1);
    ETH_STATIC_GATEWAY[sizeof(ETH_STATIC_GATEWAY) - 1] = '\0';
    Serial.print("[NVS] Passerelle Ethernet chargee : ");
    Serial.println(ETH_STATIC_GATEWAY);
  }

  String ethSN = prefs.getString("eth_sn", "");
  if (ethSN.length() > 0) {
    memset(ETH_STATIC_SUBNET, 0, sizeof(ETH_STATIC_SUBNET));
    strncpy(ETH_STATIC_SUBNET, ethSN.c_str(), sizeof(ETH_STATIC_SUBNET) - 1);
    ETH_STATIC_SUBNET[sizeof(ETH_STATIC_SUBNET) - 1] = '\0';
  }

  String ethDNS = prefs.getString("eth_dns", "");
  if (ethDNS.length() > 0) {
    memset(ETH_STATIC_DNS, 0, sizeof(ETH_STATIC_DNS));
    strncpy(ETH_STATIC_DNS, ethDNS.c_str(), sizeof(ETH_STATIC_DNS) - 1);
    ETH_STATIC_DNS[sizeof(ETH_STATIC_DNS) - 1] = '\0';
  }

  String pPass = prefs.getString("portal_pass", "");
  if (pPass.length() > 0) {
    memset(WEB_PORTAL_PASSWORD, 0, sizeof(WEB_PORTAL_PASSWORD));
    strncpy(WEB_PORTAL_PASSWORD, pPass.c_str(), sizeof(WEB_PORTAL_PASSWORD) - 1);
    WEB_PORTAL_PASSWORD[sizeof(WEB_PORTAL_PASSWORD) - 1] = '\0';
    Serial.println("[NVS] Mot de passe Portail Web charge.");
  }

  String wSSID = prefs.getString("wifi_ssid", "");
  if (wSSID.length() > 0) {
    memset(WIFI_CONFIG_SSID, 0, sizeof(WIFI_CONFIG_SSID));
    strncpy(WIFI_CONFIG_SSID, wSSID.c_str(), sizeof(WIFI_CONFIG_SSID) - 1);
    WIFI_CONFIG_SSID[sizeof(WIFI_CONFIG_SSID) - 1] = '\0';
    Serial.println("[NVS] SSID Wi-Fi charge : " + String(WIFI_CONFIG_SSID));
  }

  String wPass = prefs.getString("wifi_pass", "");
  if (wPass.length() > 0) {
    memset(WIFI_CONFIG_PASS, 0, sizeof(WIFI_CONFIG_PASS));
    strncpy(WIFI_CONFIG_PASS, wPass.c_str(), sizeof(WIFI_CONFIG_PASS) - 1);
    WIFI_CONFIG_PASS[sizeof(WIFI_CONFIG_PASS) - 1] = '\0';
  }

  prefs.end();
  Serial.println("[NVS] Chargement NVS termine avec succes.");
  Serial.flush();
}
