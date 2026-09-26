const dgram = require("dgram");

function startUdpDiscovery(port = 5001) {
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  socket.on("error", (err) => {
    console.error("[UDP Discovery] Erreur socket:", err.message);
  });

  socket.on("message", (msg, rinfo) => {
    const rawMsg = msg.toString().trim();
    console.log(`[UDP Discovery] Requete recue de ${rinfo.address}:${rinfo.port} -> "${rawMsg}"`);

    if (rawMsg.includes("DISCOVER_POINTEUSE_SERVER")) {
      const response = Buffer.from("POINTEUSE_SERVER_HERE");

      // 1. Reponse Unicast directe vers l'IP de la pointeuse
      socket.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error(`[UDP Discovery] Erreur envoi unicast (${rinfo.address}):`, err.message);
        } else {
          console.log(`[UDP Discovery] Reponse unicast envoyee a la pointeuse (${rinfo.address}:${rinfo.port})`);
        }
      });

      // 2. Reponse Broadcast (255.255.255.255) au cas ou l'unicast est bloque
      socket.send(response, 5001, "255.255.255.255", (err) => {
        if (!err) {
          console.log(`[UDP Discovery] Reponse broadcast envoyee (255.255.255.255:5001)`);
        }
      });
    }
  });

  socket.bind(port, "0.0.0.0", () => {
    socket.setBroadcast(true);
    console.log(`[UDP Discovery] Service actif sur le port ${port} (0.0.0.0)`);
  });
}

module.exports = startUdpDiscovery;

