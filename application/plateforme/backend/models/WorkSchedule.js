const mongoose = require("mongoose");

const dayScheduleSchema = new mongoose.Schema({
  jourIndex: { type: Number, required: true }, // 0: Dimanche, 1: Lundi, ..., 6: Samedi
  nomJour: { type: String, required: true },
  heureDebut: { type: String, default: "08:00" },
  heureFin: { type: String, default: "17:00" },
  heureDebutPointage: { type: String, default: "07:30" }, // Début d'autorisation de pointage défini par l'admin
  heureFinPointage: { type: String, default: "18:00" },   // Fin d'autorisation de pointage définie par l'admin
  heureDebutPause: { type: String, default: "12:00" },   // Début de la pause repas défini par l'admin
  heureFinPause: { type: String, default: "13:00" },     // Fin de la pause repas définie par l'admin
  tolerenceRetardEntree: { type: Number, default: 5 },   // Tolérance de retard à l'arrivée (en minutes)
  tolerenceRetardPause: { type: Number, default: 5 },    // Tolérance de retard retour de pause (en minutes)
  dureePauseCigaretteMax: { type: Number, default: 10 }, // Durée max autorisée pour la pause cigarette (en minutes)
  margeFinService: { type: Number, default: 35 },        // Anticipation autorisée pour Fin de Service (en minutes avant heureFin)
  delaiNotificationOubliFinService: { type: Number, default: 15 }, // Délai en minutes après heureFin pour notif oubli fin de service
  estJourOuvre: { type: Boolean, default: true },
}, { _id: false });

const workScheduleSchema = new mongoose.Schema({
  nom: { type: String, required: true }, // ex: "Équipe Matin", "Équipe Soir", "Horaire Standard"
  description: { type: String, default: "" },
  estParDefaut: { type: Boolean, default: false },
  jours: { type: [dayScheduleSchema], required: true },
}, { timestamps: true });

module.exports = mongoose.model("WorkSchedule", workScheduleSchema);
