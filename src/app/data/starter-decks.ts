import { Domain } from '../models/card.model';
import { StarterDeck } from '../models/deck.model';

export const STARTER_DECKS: StarterDeck[] = [
  {
    id: 'starter-cyber-assault',
    name: 'Cyber Assault',
    description: 'Agression numérique — attaquants rapides et cybersécurité offensive.',
    domains: [Domain.IT, Domain.Police],
    entries: [
      // IT low-cost (1-2)
      { cardId: 'it-001', quantity: 3 }, // Développeur Junior (1)
      { cardId: 'it-002', quantity: 2 }, // Technicien Support (1)
      { cardId: 'it-012', quantity: 2 }, // Testeur QA (2)
      { cardId: 'it-015', quantity: 2 }, // Admin Réseau (2)
      { cardId: 'it-024', quantity: 2 }, // IDE Pro tool (1)
      // Police low-cost (1-2)
      { cardId: 'po-001', quantity: 3 }, // Agent de Patrouille (1)
      { cardId: 'po-012', quantity: 2 }, // Agent de Police (1)
      { cardId: 'po-024', quantity: 2 }, // Menottes tool (1)
      // IT mid-cost (3-4)
      { cardId: 'it-003', quantity: 2 }, // Développeur Full-Stack (3)
      { cardId: 'it-004', quantity: 2 }, // Analyste Cybersécurité (3)
      { cardId: 'it-007', quantity: 2 }, // Hacker Éthique (4)
      { cardId: 'it-021', quantity: 2 }, // Analyste SOC (4)
      // Police mid-cost (3-4)
      { cardId: 'po-003', quantity: 2 }, // Détective (3)
      { cardId: 'po-007', quantity: 2 }, // Agent Infiltré (4)
      // High-cost (5-6)
      { cardId: 'it-006', quantity: 2 }, // Data Scientist (5)
      { cardId: 'po-006', quantity: 2 }, // Chef d'Équipe RAID (5)
      // Expensive (7+)
      { cardId: 'it-008', quantity: 1 }, // Directeur Technique (7)
      { cardId: 'po-008', quantity: 1 }, // Commissaire (7)
      // Events
      { cardId: 'it-011', quantity: 2 }, // Cyberattaque (4)
      { cardId: 'po-011', quantity: 2 }, // Descente de Police (4)
    ],
  },
  {
    id: 'starter-batisseurs',
    name: 'Les Bâtisseurs',
    description: 'Construction et artisanat — montée en puissance progressive.',
    domains: [Domain.UrbanPlanning, Domain.Crafts],
    entries: [
      // Urban Planning low-cost
      { cardId: 'up-001', quantity: 3 }, // Géomètre (1)
      { cardId: 'up-016', quantity: 2 }, // Cartographe (1)
      { cardId: 'up-021', quantity: 2 }, // Terrassier (1)
      { cardId: 'up-020', quantity: 2 }, // Maçon Spécialisé (2)
      { cardId: 'up-024', quantity: 2 }, // Théodolite tool (1)
      // Crafts low-cost
      { cardId: 'cr-001', quantity: 3 }, // Apprenti (1)
      { cardId: 'cr-012', quantity: 2 }, // Charpentier (1)
      { cardId: 'cr-002', quantity: 2 }, // Menuisier (2)
      // Urban mid-cost (3-4)
      { cardId: 'up-003', quantity: 2 }, // Architecte Paysagiste (3)
      { cardId: 'up-004', quantity: 2 }, // Ingénieur Civil (3)
      { cardId: 'up-017', quantity: 2 }, // Chef de Chantier (4)
      // Crafts mid-cost
      { cardId: 'cr-003', quantity: 2 }, // Forgeron (3)
      { cardId: 'cr-004', quantity: 2 }, // Électricien (3)
      { cardId: 'cr-018', quantity: 2 }, // Soudeur (4)
      // High-cost
      { cardId: 'up-006', quantity: 2 }, // Designer Urbain (5)
      { cardId: 'cr-006', quantity: 2 }, // Maçon (5)
      // Expensive
      { cardId: 'up-008', quantity: 1 }, // Directeur de l'Urbanisme (7)
      { cardId: 'cr-008', quantity: 1 }, // Maître Artisan (7)
      // Events
      { cardId: 'up-011', quantity: 2 }, // Nouveau Quartier (3)
      { cardId: 'cr-039', quantity: 2 }, // Apprentissage Accéléré (2)
    ],
  },
  {
    id: 'starter-service-public',
    name: 'Service Public',
    description: 'Enseignement et santé — récupération de réputation et résilience.',
    domains: [Domain.Teacher, Domain.Health],
    entries: [
      // Teacher low-cost
      { cardId: 'tc-001', quantity: 3 }, // Assistant Pédagogique (1)
      { cardId: 'tc-002', quantity: 2 }, // Professeur Remplaçant (1)
      { cardId: 'tc-012', quantity: 2 }, // Surveillant (1)
      { cardId: 'tc-014', quantity: 2 }, // Documentaliste (2)
      { cardId: 'tc-024', quantity: 2 }, // Manuel Scolaire tool (1)
      // Health low-cost
      { cardId: 'he-001', quantity: 3 }, // Aide-Soignant (1)
      { cardId: 'he-002', quantity: 2 }, // Infirmier (2)
      { cardId: 'he-022', quantity: 2 }, // Ambulancier (1)
      // Teacher mid-cost
      { cardId: 'tc-003', quantity: 2 }, // Professeur de Maths (3)
      { cardId: 'tc-004', quantity: 2 }, // Professeur de Sciences (3)
      { cardId: 'tc-005', quantity: 2 }, // Conseiller d'Orientation (4)
      // Health mid-cost
      { cardId: 'he-003', quantity: 2 }, // Médecin Généraliste (3)
      { cardId: 'he-004', quantity: 2 }, // Chirurgien (4)
      // High-cost
      { cardId: 'tc-006', quantity: 2 }, // Chef de Département (5)
      { cardId: 'he-006', quantity: 2 }, // Urgentiste (5)
      // Expensive
      { cardId: 'tc-008', quantity: 1 }, // Directeur d'École (7)
      { cardId: 'he-008', quantity: 1 }, // Directeur d'Hôpital (7)
      // Events
      { cardId: 'he-036', quantity: 2 }, // Don du Sang (2)
      { cardId: 'ev-006', quantity: 2 }, // Formation Continue (2)
      { cardId: 'tc-011', quantity: 2 }, // Journée Pédagogique (2)
    ],
  },
  {
    id: 'starter-force-justice',
    name: 'Force & Justice',
    description: 'Contrôle et blocage — défense impénétrable et verdicts décisifs.',
    domains: [Domain.Military, Domain.Justice],
    entries: [
      // Military low-cost
      { cardId: 'mi-001', quantity: 3 }, // Soldat (1)
      { cardId: 'mi-012', quantity: 2 }, // Fantassin (1)
      { cardId: 'mi-002', quantity: 2 }, // Sentinelle (2)
      { cardId: 'mi-018', quantity: 2 }, // Légionnaire (2)
      { cardId: 'mi-026', quantity: 2 }, // Ration de Combat tool (1)
      // Justice low-cost
      { cardId: 'ju-001', quantity: 3 }, // Greffier (1)
      { cardId: 'ju-021', quantity: 2 }, // Conciliateur (1)
      { cardId: 'ju-002', quantity: 2 }, // Avocat (2)
      // Military mid-cost
      { cardId: 'mi-003', quantity: 2 }, // Caporal (3)
      { cardId: 'mi-004', quantity: 2 }, // Tireur d'Élite (3)
      { cardId: 'mi-019', quantity: 2 }, // Sous-Officier (3)
      // Justice mid-cost
      { cardId: 'ju-003', quantity: 2 }, // Procureur (3)
      { cardId: 'ju-004', quantity: 2 }, // Juge d'Instruction (3)
      { cardId: 'ju-015', quantity: 2 }, // Avocat Général (4)
      // High-cost
      { cardId: 'mi-006', quantity: 2 }, // Commandant (5)
      { cardId: 'ju-006', quantity: 2 }, // Magistrat (5)
      // Expensive
      { cardId: 'mi-008', quantity: 1 }, // Général (7)
      { cardId: 'ju-008', quantity: 1 }, // Garde des Sceaux (7)
      // Events
      { cardId: 'mi-035', quantity: 2 }, // Embuscade (2)
      { cardId: 'ju-035', quantity: 2 }, // Non-Lieu (2)
    ],
  },
  {
    id: 'starter-urgences',
    name: 'Urgences',
    description: 'Pompiers et finance — équipement synergique et gestion de budget.',
    domains: [Domain.Firefighter, Domain.Finance],
    entries: [
      // Firefighter low-cost
      { cardId: 'ff-001', quantity: 3 }, // Sapeur-Pompier (1)
      { cardId: 'ff-002', quantity: 2 }, // Pompier Volontaire (1)
      { cardId: 'ff-020', quantity: 2 }, // Sapeur 1ère Classe (1)
      { cardId: 'ff-012', quantity: 2 }, // Caporal-Chef (2)
      { cardId: 'ff-024', quantity: 2 }, // Hache d'Incendie tool (1)
      // Finance low-cost
      { cardId: 'fi-001', quantity: 3 }, // Caissier (1)
      { cardId: 'fi-012', quantity: 2 }, // Agent de Change (1)
      { cardId: 'fi-002', quantity: 2 }, // Comptable (2)
      // Firefighter mid-cost
      { cardId: 'ff-003', quantity: 2 }, // Chef d'Agrès (3)
      { cardId: 'ff-004', quantity: 2 }, // Conducteur d'Engin (3)
      { cardId: 'ff-015', quantity: 2 }, // Spécialiste Feux de Forêt (4)
      // Finance mid-cost
      { cardId: 'fi-003', quantity: 2 }, // Analyste Financier (3)
      { cardId: 'fi-004', quantity: 2 }, // Banquier (3)
      // High-cost
      { cardId: 'ff-006', quantity: 2 }, // Démineur (5)
      { cardId: 'fi-006', quantity: 2 }, // Trader (5)
      // Expensive
      { cardId: 'ff-008', quantity: 1 }, // Colonel des Pompiers (7)
      { cardId: 'fi-008', quantity: 1 }, // Directeur de Banque (7)
      // Events
      { cardId: 'ff-034', quantity: 2 }, // Alerte Rouge (2)
      { cardId: 'fi-038', quantity: 2 }, // Subvention d'État (2)
      { cardId: 'ev-003', quantity: 2 }, // Prime d'Embauche (2)
    ],
  },
  {
    id: 'starter-cyberattaque',
    name: 'Cyberattaque',
    description: "IT pur — vitesse et célérité, submergez l'adversaire rapidement.",
    domains: [Domain.IT],
    entries: [
      // Early game aggression (cost 1-2)
      { cardId: 'it-001', quantity: 3 }, // Développeur Junior (1)
      { cardId: 'it-002', quantity: 3 }, // Technicien Support (1)
      { cardId: 'it-012', quantity: 3 }, // Testeur QA (2)
      { cardId: 'it-013', quantity: 2 }, // Développeur Mobile (2)
      { cardId: 'it-015', quantity: 3 }, // Admin Réseau (2)
      { cardId: 'it-024', quantity: 2 }, // IDE Pro tool (1)
      { cardId: 'it-025', quantity: 2 }, // VPN Sécurisé tool (2)
      // Mid game pressure (cost 3-4)
      { cardId: 'it-003', quantity: 3 }, // Développeur Full-Stack (3)
      { cardId: 'it-004', quantity: 2 }, // Analyste Cybersécurité (3)
      { cardId: 'it-014', quantity: 2 }, // DevOps Engineer (3)
      { cardId: 'it-007', quantity: 2 }, // Hacker Éthique (4)
      { cardId: 'it-021', quantity: 2 }, // Analyste SOC (4)
      // Finishers (cost 5-7)
      { cardId: 'it-006', quantity: 2 }, // Data Scientist (5)
      { cardId: 'it-016', quantity: 1 }, // Architecte Cloud (6)
      { cardId: 'it-008', quantity: 1 }, // Directeur Technique (7)
      // Aggressive events
      { cardId: 'it-011', quantity: 2 }, // Cyberattaque (4)
      { cardId: 'ev-002', quantity: 2 }, // Réunion d'Urgence (1)
      { cardId: 'ev-007', quantity: 2 }, // Recrutement de Masse (3)
      { cardId: 'ev-005', quantity: 1 }, // Audit de Performance (4)
    ],
  },
  {
    id: 'starter-ecole-sagesse',
    name: 'École de Sagesse',
    description: 'Enseignants — défense, soins et endurance pour gagner en longueur.',
    domains: [Domain.Teacher],
    entries: [
      // Defensive early game
      { cardId: 'tc-001', quantity: 3 }, // Assistant Pédagogique (1)
      { cardId: 'tc-002', quantity: 3 }, // Professeur Remplaçant (1)
      { cardId: 'tc-012', quantity: 3 }, // Surveillant (1)
      { cardId: 'tc-013', quantity: 2 }, // Professeur de Sport (2)
      { cardId: 'tc-014', quantity: 2 }, // Documentaliste (2)
      { cardId: 'tc-024', quantity: 2 }, // Manuel Scolaire tool (1)
      { cardId: 'tc-025', quantity: 2 }, // Tableau Interactif tool (2)
      // Mid game blockers
      { cardId: 'tc-003', quantity: 3 }, // Professeur de Maths (3)
      { cardId: 'tc-004', quantity: 2 }, // Professeur de Sciences (3)
      { cardId: 'tc-016', quantity: 2 }, // Professeur de Philosophie (3)
      { cardId: 'tc-005', quantity: 2 }, // Conseiller d'Orientation (4)
      { cardId: 'tc-017', quantity: 2 }, // Professeur Principal (4)
      // Late game power
      { cardId: 'tc-006', quantity: 2 }, // Chef de Département (5)
      { cardId: 'tc-018', quantity: 1 }, // Inspecteur Académique (6)
      { cardId: 'tc-008', quantity: 2 }, // Directeur d'École (7)
      // Defensive/healing events
      { cardId: 'tc-011', quantity: 2 }, // Journée Pédagogique (2)
      { cardId: 'ev-006', quantity: 2 }, // Formation Continue (2)
      { cardId: 'ev-004', quantity: 2 }, // Grève Générale (3)
      { cardId: 'ev-001', quantity: 1 }, // Crise Économique (5)
    ],
  },
  {
    id: 'starter-syndicat-artisan',
    name: 'Syndicat Artisan',
    description: 'Artisans — construction et outils, croissance exponentielle.',
    domains: [Domain.Crafts],
    entries: [
      // Tool/equipment focus
      { cardId: 'cr-001', quantity: 3 }, // Apprenti (1)
      { cardId: 'cr-012', quantity: 3 }, // Charpentier (1)
      { cardId: 'cr-013', quantity: 2 }, // Plombier (1)
      { cardId: 'cr-002', quantity: 2 }, // Menuisier (2)
      { cardId: 'cr-015', quantity: 2 }, // Ébéniste (2)
      { cardId: 'cr-024', quantity: 2 }, // Marteau tool (1)
      { cardId: 'cr-026', quantity: 2 }, // Scie Circulaire tool (1)
      { cardId: 'cr-027', quantity: 2 }, // Niveau à Bulle tool (2)
      // Mid game crafters
      { cardId: 'cr-003', quantity: 2 }, // Forgeron (3)
      { cardId: 'cr-004', quantity: 2 }, // Électricien (3)
      { cardId: 'cr-016', quantity: 2 }, // Couvreur (3)
      { cardId: 'cr-005', quantity: 2 }, // Plâtrier (4)
      { cardId: 'cr-018', quantity: 2 }, // Soudeur (4)
      // Late game masters
      { cardId: 'cr-006', quantity: 2 }, // Maçon (5)
      { cardId: 'cr-019', quantity: 1 }, // Chef d'Atelier (6)
      { cardId: 'cr-008', quantity: 2 }, // Maître Artisan (7)
      // Synergy events
      { cardId: 'cr-039', quantity: 2 }, // Apprentissage Accéléré (2)
      { cardId: 'ev-008', quantity: 2 }, // Journée Portes Ouvertes (2)
      { cardId: 'ev-007', quantity: 1 }, // Recrutement de Masse (3)
    ],
  },
  {
    id: 'starter-triple-alliance',
    name: 'Triple Alliance',
    description: 'Justice, Santé, Finance — synergie multi-domaines et flexibilité tactique.',
    domains: [Domain.Justice, Domain.Health, Domain.Finance],
    entries: [
      // Justice early
      { cardId: 'ju-001', quantity: 2 }, // Greffier (1)
      { cardId: 'ju-021', quantity: 2 }, // Conciliateur (1)
      { cardId: 'ju-002', quantity: 2 }, // Avocat (2)
      // Health early
      { cardId: 'he-001', quantity: 2 }, // Aide-Soignant (1)
      { cardId: 'he-022', quantity: 2 }, // Ambulancier (1)
      { cardId: 'he-002', quantity: 2 }, // Infirmier (2)
      // Finance early
      { cardId: 'fi-001', quantity: 2 }, // Caissier (1)
      { cardId: 'fi-012', quantity: 2 }, // Agent de Change (1)
      { cardId: 'fi-002', quantity: 2 }, // Comptable (2)
      // Justice mid
      { cardId: 'ju-003', quantity: 2 }, // Procureur (3)
      { cardId: 'ju-004', quantity: 2 }, // Juge d'Instruction (3)
      // Health mid
      { cardId: 'he-003', quantity: 2 }, // Médecin Généraliste (3)
      { cardId: 'he-004', quantity: 1 }, // Chirurgien (4)
      // Finance mid
      { cardId: 'fi-003', quantity: 2 }, // Analyste Financier (3)
      { cardId: 'fi-004', quantity: 1 }, // Banquier (3)
      // High cost
      { cardId: 'ju-006', quantity: 1 }, // Magistrat (5)
      { cardId: 'he-006', quantity: 1 }, // Urgentiste (5)
      { cardId: 'fi-006', quantity: 1 }, // Trader (5)
      // Top end
      { cardId: 'ju-008', quantity: 1 }, // Garde des Sceaux (7)
      { cardId: 'he-008', quantity: 1 }, // Directeur d'Hôpital (7)
      // Versatile events
      { cardId: 'he-036', quantity: 2 }, // Don du Sang (2)
      { cardId: 'fi-038', quantity: 1 }, // Subvention d'État (2)
      { cardId: 'ju-035', quantity: 2 }, // Non-Lieu (2)
      { cardId: 'ev-003', quantity: 1 }, // Prime d'Embauche (2)
    ],
  },
];
