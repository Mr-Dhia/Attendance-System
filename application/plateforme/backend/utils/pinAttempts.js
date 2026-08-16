const tentatives = new Map(); // deviceId -> { count, bloqueJusqua }

const MAX_TENTATIVES = 5;
const DUREE_BLOCAGE_MS = 60000; // 1 minute

module.exports = {
  estBloque: (deviceId) => {
    const entry = tentatives.get(deviceId);
    if (!entry) return false;
    if (entry.bloqueJusqua && Date.now() < entry.bloqueJusqua) return true;
    return false;
  },
  enregistrerEchec: (deviceId) => {
    const entry = tentatives.get(deviceId) || { count: 0, bloqueJusqua: null };
    entry.count += 1;
    if (entry.count >= MAX_TENTATIVES) {
      entry.bloqueJusqua = Date.now() + DUREE_BLOCAGE_MS;
      entry.count = 0;
    }
    tentatives.set(deviceId, entry);
  },
  reinitialiser: (deviceId) => {
    tentatives.delete(deviceId);
  },
};