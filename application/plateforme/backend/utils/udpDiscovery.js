const dgram = require("dgram");

function startUdpDiscovery(port = 5001) {
  const socket = dgram.createSocket("udp4");

  socket.on("error", (err) => {
    console.error("Erreur UDP Discovery:", err.message);
  });

  socket.on("message", (msg, rinfo) => {
    if (msg.toString().trim() === "DISCOVER_POINTEUSE_SERVER") {
      console.log(`[UDP Discovery] Requete recue de ${rinfo.address}:${rinfo.port}`);
      const response = Buffer.from("POINTEUSE_SERVER_HERE");
      socket.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error("[UDP Discovery] Erreur envoi reponse:", err);
        } else {
          console.log(`[UDP Discovery] Reponse envoyee a la pointeuse (${rinfo.address})`);
        }
      });
    }
  });

  socket.bind(port, () => {
    socket.setBroadcast(true);
    console.log(`[UDP Discovery] Service active sur le port ${port}`);
  });
}

module.exports = startUdpDiscovery;
