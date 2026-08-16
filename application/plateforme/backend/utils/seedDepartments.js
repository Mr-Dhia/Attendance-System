const Department = require('../models/Department');

const defaultDepartments = [
  {
    name: 'Informatique & Systèmes',
    code: 'IT',
    description: 'Gestion des infrastructures IT, développement logiciel et support technique.',
    color: '#3B82F6',
    positions: [
      { title: 'Développeur Full Stack', code: 'DEV-FS', description: 'Conception et développement d\'applications web et mobiles.' },
      { title: 'Administrateur Systèmes & Réseaux', code: 'ADMIN-SYS', description: 'Gestion des serveurs, de la sécurité et du réseau d\'entreprise.' },
      { title: 'Technicien Support IT', code: 'TECH-IT', description: 'Assistance aux utilisateurs et maintenance du parc informatique.' },
      { title: 'Chef de Projet IT', code: 'PM-IT', description: 'Supervision et pilotage des projets digitaux.' }
    ]
  },
  {
    name: 'Ressources Humaines',
    code: 'RH',
    description: 'Gestion des talents, de la paie et des relations sociales.',
    color: '#EC4899',
    positions: [
      { title: 'Responsable Ressources Humaines', code: 'RESP-RH', description: 'Pilotage de la stratégie RH de l\'entreprise.' },
      { title: 'Chargé de Recrutement', code: 'REC-RH', description: 'Sourcing et intégration des nouveaux collaborateurs.' },
      { title: 'Gestionnaire de Paie', code: 'PAIE-RH', description: 'Gestion administrative et établissement des bulletins de paie.' }
    ]
  },
  {
    name: 'Finance & Comptabilité',
    code: 'FIN',
    description: 'Gestion budgétaire, comptabilité et analyse financière.',
    color: '#10B981',
    positions: [
      { title: 'Directeur Financier', code: 'CFO', description: 'Supervision des opérations financières et budgétaires.' },
      { title: 'Comptable Principal', code: 'COMPTA', description: 'Tenue des comptes généraux et bilan financier.' },
      { title: 'Analyste Financier', code: 'ANALYST-FIN', description: 'Analyse des coûts, prévisions et tableaux de bord.' }
    ]
  },
  {
    name: 'Commercial & Ventes',
    code: 'COMM',
    description: 'Développement commercial, prospection et relation client.',
    color: '#F59E0B',
    positions: [
      { title: 'Responsable Commercial', code: 'RESP-COMM', description: 'Gestion de l\'équipe commerciale et objectifs de ventes.' },
      { title: 'Chargé de Marketing Digital', code: 'MKT-DIG', description: 'Communication, réseaux sociaux et acquisition de clients.' },
      { title: 'Ingénieur d\'Affaires', code: 'ING-COMM', description: 'Développement du portefeuille grands comptes.' }
    ]
  },
  {
    name: 'Production & Logistique',
    code: 'LOG',
    description: 'Gestion des opérations de production, stocks et chaîne d\'approvisionnement.',
    color: '#8B5CF6',
    positions: [
      { title: 'Responsable Logistique', code: 'RESP-LOG', description: 'Coordination de la chaîne d\'approvisionnement et des stocks.' },
      { title: 'Chef d\'Équipe Production', code: 'CHEF-PROD', description: 'Supervision des opérations et du respect des délais.' },
      { title: 'Technicien de Maintenance', code: 'TECH-MAINT', description: 'Entretien et réparation du matériel de production.' }
    ]
  }
];

const seedDepartments = async () => {
  try {
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany(defaultDepartments);
      console.log('Départements et postes par défaut créés avec succès dans MongoDB !');
    }
  } catch (error) {
    console.error('Erreur lors du peuplement des départements :', error.message);
  }
};

module.exports = seedDepartments;
