const Notification = require("../models/Notification");

module.exports = async function createNotification(employeeId, type, message) {
  try {
    await Notification.create({ employee: employeeId, type, message });
  } catch (err) {
    console.error("Erreur creation notification:", err.message);
  }
};