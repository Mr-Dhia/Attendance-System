const Employee = require("../models/Employee");

async function sanitizeEmployeesContractData() {
  try {
    // Nettoyer les CINs et emails factices ("00000000" ou chaînes vides) qui causent l'erreur E11000 duplicate key
    await Employee.updateMany(
      { $or: [{ cin: "00000000" }, { cin: "" }] },
      { $unset: { cin: 1 } }
    );
    await Employee.updateMany(
      { email: "" },
      { $unset: { email: 1 } }
    );
    await Employee.updateMany(
      { telephone: "" },
      { $unset: { telephone: 1 } }
    );

    await Employee.updateMany({}, { $unset: { workSchedule: 1 } });

    const employees = await Employee.find();
    let updatedCount = 0;

    for (const emp of employees) {
      let needsSave = false;

      // 1. Pour les anciens employés sans date de début de contrat, fixer la date d'embauche ou de création
      if (!emp.scheduleStartDate) {
        emp.scheduleStartDate = emp.dateEmbauche || emp.createdAt || new Date();
        needsSave = true;
      }

      // 2. Pour les anciens employés inactifs, libérer l'horaire de travail s'il est encore affecté
      if (emp.statut === "Inactif" && emp.workSchedule) {
        emp.workSchedule = null;
        needsSave = true;
      }

      // 3. Pour les anciens employés sans CIN, générer un numéro CIN 8 chiffres unique temporaire basé sur le matricule
      if (!emp.cin) {
        const numericPart = (emp.matricule || "").replace(/\D/g, "");
        let digits = numericPart ? numericPart.padStart(8, "0").slice(-8) : "00000001";
        if (digits === "00000000") digits = "00000001";

        let uniqueCin = digits;
        let counter = 1;
        while (await Employee.findOne({ cin: uniqueCin, _id: { $ne: emp._id } })) {
          uniqueCin = String(Number(digits) + counter).padStart(8, "0").slice(-8);
          counter++;
        }

        emp.cin = uniqueCin;
        needsSave = true;
      }

      if (needsSave) {
        await emp.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`[Sanitizer] ${updatedCount} ancien(s) employé(s) mis à jour avec leurs données de contrat et CIN.`);
    }
  } catch (err) {
    console.error("[Sanitizer] Erreur sanitization contrats employés :", err.message);
  }
}

module.exports = sanitizeEmployeesContractData;
