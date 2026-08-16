const Employee = require("../models/Employee");
const pendingFingerprint = require("../utils/pendingFingerprint");
const pendingDeletions = require("../utils/pendingDeletions");

exports.getAll = async (req, res) => {
  try {
    const employees = await Employee.find().populate("workSchedule");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("workSchedule");
    if (!employee) return res.status(404).json({ message: "Employé introuvable" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.create = async (req, res) => {
  try {
    const photo = req.file ? `/uploads/${req.file.filename}` : "";
    const body = { ...req.body };

    if (body.cin) {
      body.cin = body.cin.toString().trim();
      if (body.cin === "" || body.cin === "00000000") {
        delete body.cin;
      } else if (!/^\d{8}$/.test(body.cin)) {
        return res.status(400).json({ message: "CIN invalide (8 chiffres requis)" });
      }
    } else {
      delete body.cin;
    }

    if (body.email) {
      body.email = body.email.toString().trim();
      if (body.email === "") delete body.email;
    } else {
      delete body.email;
    }

    if (body.telephone) {
      body.telephone = body.telephone.toString().trim();
      if (body.telephone === "") delete body.telephone;
    } else {
      delete body.telephone;
    }

    if (body.matricule) {
      let mat = body.matricule.toString().trim();
      const inactifExp = await Employee.findOne({ matricule: mat, statut: "Inactif" });
      if (inactifExp) {
        await Employee.findByIdAndDelete(inactifExp._id);
      }
    }

    const employee = await Employee.create({ ...body, photo });
    res.status(201).json(employee);
  } catch (err) {
    console.error("Erreur création employé :", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "champ";
      return res.status(400).json({ message: `Ce ${field} est déjà utilisé par un autre employé.` });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo;
    const body = { ...req.body };

    if (body.cin !== undefined) {
      body.cin = body.cin ? body.cin.toString().trim() : "";
      if (body.cin === "" || body.cin === "00000000") {
        delete body.cin;
        await Employee.updateOne({ _id: req.params.id }, { $unset: { cin: 1 } });
      } else if (!/^\d{8}$/.test(body.cin)) {
        return res.status(400).json({ message: "CIN invalide (8 chiffres requis)" });
      }
    }

    if (body.email !== undefined) {
      body.email = body.email ? body.email.toString().trim() : "";
      if (body.email === "") {
        delete body.email;
        await Employee.updateOne({ _id: req.params.id }, { $unset: { email: 1 } });
      }
    }

    if (body.telephone !== undefined) {
      body.telephone = body.telephone ? body.telephone.toString().trim() : "";
      if (body.telephone === "") {
        delete body.telephone;
        await Employee.updateOne({ _id: req.params.id }, { $unset: { telephone: 1 } });
      }
    }

    const { scheduleStartDate, scheduleEndDate, statut } = body;
    if (scheduleStartDate && scheduleEndDate && new Date(scheduleStartDate) > new Date(scheduleEndDate)) {
      return res.status(400).json({ message: "La date de début de contrat ne peut pas être supérieure à la date de fin." });
    }

    const updateData = { ...body, photo, creeRapide: false };
    if (statut === "Inactif") {
      updateData.workSchedule = null;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("workSchedule");
    res.json(employee);
  } catch (err) {
    console.error("Erreur mise à jour employé :", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "champ";
      const fieldLabels = { cin: "CIN", email: "Email", telephone: "Téléphone", matricule: "Matricule" };
      const label = fieldLabels[field] || field;
      return res.status(400).json({
        message: `Ce ${label} est déjà utilisé par un autre employé.`,
        field: field,
      });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee && employee.fingerIDs && employee.fingerIDs.length > 0) {
      employee.fingerIDs.forEach(fid => pendingDeletions.add(fid));
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employé supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFingerprint = async (req, res) => {
  try {
    const { fingerID } = req.params;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $pull: { fingerIDs: Number(fingerID) } },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: "Employé introuvable" });

    pendingDeletions.add(Number(fingerID)); // pour suppression cote capteur aussi
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.requestFingerprintEnroll = async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employé introuvable" });

  pendingFingerprint.set(req.params.id);
  res.json({ message: "En attente du scan sur le capteur" });
};

exports.quickCreate = async (req, res) => {
  try {
    const { matricule } = req.body;
    if (!matricule) return res.status(400).json({ success: false, message: "Matricule requis" });

    let cleanMatricule = matricule.toString().trim();
    if (!/^m/i.test(cleanMatricule)) {
      if (/^\d+$/.test(cleanMatricule)) {
        cleanMatricule = "M" + cleanMatricule.padStart(3, "0");
      } else {
        cleanMatricule = "M" + cleanMatricule;
      }
    } else {
      cleanMatricule = cleanMatricule.toUpperCase();
    }

    const existing = await Employee.findOne({ matricule: cleanMatricule });
    if (existing) {
      if (existing.statut === "Inactif") {
        existing.statut = "Actif";
        existing.creeRapide = true;
        await existing.save();
        return res.status(200).json({
          success: true,
          alreadyExisted: false,
          reactivated: true,
          employee: {
            _id: existing._id,
            name: existing.name,
            matricule: existing.matricule
          },
          _id: existing._id,
          name: existing.name,
          matricule: existing.matricule
        });
      }

      return res.status(200).json({
        success: true,
        alreadyExisted: true,
        employee: {
          _id: existing._id,
          name: existing.name,
          matricule: existing.matricule
        },
        _id: existing._id,
        name: existing.name,
        matricule: existing.matricule
      });
    }

    const employee = await Employee.create({
      matricule: cleanMatricule,
      name: `Employé ${cleanMatricule}`,
      creeRapide: true,
    });

    res.status(201).json({
      success: true,
      alreadyExisted: false,
      employee: {
        _id: employee._id,
        name: employee.name,
        matricule: employee.matricule
      },
      _id: employee._id,
      name: employee.name,
      matricule: employee.matricule
    });
  } catch (err) {
    console.error("Erreur quickCreate :", err);
    res.status(400).json({ success: false, message: err.message });
  }
};