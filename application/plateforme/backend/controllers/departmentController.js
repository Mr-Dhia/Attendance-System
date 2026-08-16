const Department = require('../models/Department');
const Employee = require('../models/Employee');

// @desc    Obtenir tous les départements avec statistiques d'employés
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const employees = await Employee.find({}, 'department post position');

    const result = departments.map(dept => {
      const deptObj = dept.toObject();
      
      // Compter le nombre total d'employés dans ce département
      const deptEmployees = employees.filter(emp => 
        (emp.department && emp.department.toString().toLowerCase() === dept.name.toLowerCase()) ||
        (emp.department && emp.department.toString() === dept._id.toString())
      );

      deptObj.totalEmployees = deptEmployees.length;

      // Compter le nombre d'employés par poste
      deptObj.positions = deptObj.positions.map(pos => {
        const posEmployees = deptEmployees.filter(emp => 
          (emp.position && emp.position.toString().toLowerCase() === pos.title.toLowerCase()) ||
          (emp.post && emp.post.toString().toLowerCase() === pos.title.toLowerCase())
        );
        return {
          ...pos,
          employeeCount: posEmployees.length
        };
      });

      return deptObj;
    });

    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Erreur getDepartments:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des départements', error: error.message });
  }
};

// @desc    Créer un département
// @route   POST /api/departments
// @access  Private
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, color, positions } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Le nom et le code du département sont requis' });
    }

    const existingDept = await Department.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }]
    });

    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Un département avec ce nom ou ce code existe déjà' });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      color: color || '#3B82F6',
      positions: Array.isArray(positions) ? positions : []
    });

    res.status(201).json({
      success: true,
      message: 'Département créé avec succès',
      data: department
    });
  } catch (error) {
    console.error('Erreur createDepartment:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du département', error: error.message });
  }
};

// @desc    Mettre à jour un département
// @route   PUT /api/departments/:id
// @access  Private
exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, description, color } = req.body;

    let department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Département introuvable' });
    }

    if (name || code) {
      const conflict = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          name ? { name: name.trim() } : null,
          code ? { code: code.trim().toUpperCase() } : null
        ].filter(Boolean)
      });

      if (conflict) {
        return res.status(400).json({ success: false, message: 'Un autre département utilise déjà ce nom ou ce code' });
      }
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (description !== undefined) department.description = description.trim();
    if (color) department.color = color;

    await department.save();

    res.json({
      success: true,
      message: 'Département mis à jour avec succès',
      data: department
    });
  } catch (error) {
    console.error('Erreur updateDepartment:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du département', error: error.message });
  }
};

// @desc    Supprimer un département
// @route   DELETE /api/departments/:id
// @access  Private
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Département introuvable' });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Département supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteDepartment:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du département', error: error.message });
  }
};

// @desc    Ajouter un poste à un département
// @route   POST /api/departments/:id/positions
// @access  Private
exports.addPosition = async (req, res) => {
  try {
    const { title, code, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Le titre du poste est requis' });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Département introuvable' });
    }

    const titleExists = department.positions.some(pos => pos.title.toLowerCase() === title.trim().toLowerCase());
    if (titleExists) {
      return res.status(400).json({ success: false, message: 'Un poste avec ce titre existe déjà dans ce département' });
    }

    department.positions.push({
      title: title.trim(),
      code: code ? code.trim().toUpperCase() : '',
      description: description ? description.trim() : ''
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Poste ajouté avec succès',
      data: department
    });
  } catch (error) {
    console.error('Erreur addPosition:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout du poste', error: error.message });
  }
};

// @desc    Mettre à jour un poste d'un département
// @route   PUT /api/departments/:id/positions/:positionId
// @access  Private
exports.updatePosition = async (req, res) => {
  try {
    const { title, code, description } = req.body;
    const { id, positionId } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Département introuvable' });
    }

    const position = department.positions.id(positionId);
    if (!position) {
      return res.status(404).json({ success: false, message: 'Poste introuvable' });
    }

    if (title) {
      const titleExists = department.positions.some(
        pos => pos._id.toString() !== positionId && pos.title.toLowerCase() === title.trim().toLowerCase()
      );
      if (titleExists) {
        return res.status(400).json({ success: false, message: 'Un autre poste porte déjà ce nom dans ce département' });
      }
      position.title = title.trim();
    }

    if (code !== undefined) position.code = code.trim().toUpperCase();
    if (description !== undefined) position.description = description.trim();

    await department.save();

    res.json({
      success: true,
      message: 'Poste mis à jour avec succès',
      data: department
    });
  } catch (error) {
    console.error('Erreur updatePosition:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du poste', error: error.message });
  }
};

// @desc    Supprimer un poste d'un département
// @route   DELETE /api/departments/:id/positions/:positionId
// @access  Private
exports.deletePosition = async (req, res) => {
  try {
    const { id, positionId } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Département introuvable' });
    }

    department.positions = department.positions.filter(pos => pos._id.toString() !== positionId);
    await department.save();

    res.json({
      success: true,
      message: 'Poste supprimé avec succès',
      data: department
    });
  } catch (error) {
    console.error('Erreur deletePosition:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du poste', error: error.message });
  }
};
