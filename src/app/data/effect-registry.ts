import { CardEffects, EffectTrigger, EffectType, TargetType } from '../models/effect.model';

/**
 * Effect registry for starter deck cards.
 * Only Priority 1 effects (draw, damage, buff, debuff, heal, budget, destroy, tap, bounce).
 * Cards with complex abilities (search, protection, tokens, etc.) are omitted for now.
 */
export const EFFECT_REGISTRY: CardEffects[] = [
  // ==================== IT ====================

  // it-001: Développeur Junior — "Quand embauché : Piochez 1 carte."
  {
    cardId: 'it-001',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' }],
  },
  // it-008: Directeur Technique — "Tous les Métiers Informatique gagnent +1/+1."
  {
    cardId: 'it-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 1, permanent: true, description: 'Tous les Metiers Informatique gagnent +1/+1' }],
  },
  // it-011: Cyberattaque — "Détruisez tous les Outils adverses."
  {
    cardId: 'it-011',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Destroy, target: TargetType.EnemyTool, value: 0, description: 'Detruit tous les Outils adverses' }],
  },
  // it-024: IDE Pro — "+1 Productivité à un Métier Informatique allié."
  {
    cardId: 'it-024',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 0, permanent: true, description: '+1 Productivite a un Metier allie' }],
  },

  // ==================== POLICE ====================

  // po-008: Commissaire de Police — "Tous les Métiers Police gagnent +1/+0. Engagez un Métier ciblé."
  {
    cardId: 'po-008',
    trigger: EffectTrigger.OnHire,
    effects: [
      { type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 0, permanent: true, description: 'Tous les Metiers Police gagnent +1/+0' },
      { type: EffectType.Tap, target: TargetType.EnemyJob, value: 0, description: 'Engage un Metier adverse' },
    ],
  },
  // po-011: Descente de Police — "Détruisez un Métier adverse avec 3 ou moins de Résilience."
  {
    cardId: 'po-011',
    trigger: EffectTrigger.OnCast,
    effects: [{
      type: EffectType.Destroy,
      target: TargetType.EnemyJob,
      value: 0,
      condition: { type: 'maxTargetResilience', value: 3 },
      description: 'Detruit un Metier adverse (3 Resilience max)',
    }],
  },
  // po-024: Menottes — "Engagez un Métier adverse."
  {
    cardId: 'po-024',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Tap, target: TargetType.EnemyJob, value: 0, description: 'Engage un Metier adverse' }],
  },

  // ==================== URBAN PLANNING ====================

  // up-001: Géomètre — "Quand embauché : Gagnez +1 Budget au prochain tour."
  {
    cardId: 'up-001',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Budget, target: TargetType.None, value: 1, description: '+1 Budget' }],
  },
  // up-003: Architecte Paysagiste — "Tous vos Métiers gagnent +0/+1 ce tour."
  {
    cardId: 'up-003',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 0, value2: 1, description: 'Tous vos Metiers gagnent +0/+1 ce tour' }],
  },
  // up-008: Directeur de l'Urbanisme — "Tous les Métiers Urbanisme gagnent +0/+2."
  {
    cardId: 'up-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 0, value2: 2, permanent: true, description: 'Tous les Metiers Urbanisme gagnent +0/+2' }],
  },
  // up-011: Nouveau Quartier — "Gagnez +3 Budget. Piochez 1 carte."
  {
    cardId: 'up-011',
    trigger: EffectTrigger.OnCast,
    effects: [
      { type: EffectType.Budget, target: TargetType.None, value: 3, description: '+3 Budget' },
      { type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' },
    ],
  },
  // up-024: Théodolite — "+1/+0 au Métier équipé. Piochez 1 carte."
  {
    cardId: 'up-024',
    trigger: EffectTrigger.OnHire,
    effects: [
      { type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 0, permanent: true, description: '+1/+0 a un Metier allie' },
      { type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' },
    ],
  },

  // ==================== CRAFTS ====================

  // cr-002: Menuisier — "Un Métier allié gagne +0/+1 en permanence."
  {
    cardId: 'cr-002',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 0, value2: 1, permanent: true, description: '+0/+1 permanent a un Metier allie' }],
  },
  // cr-008: Maître Artisan — "Tous les Métiers Artisanat gagnent +1/+1."
  {
    cardId: 'cr-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 1, permanent: true, description: 'Tous les Metiers Artisanat gagnent +1/+1' }],
  },

  // ==================== TEACHER ====================

  // tc-004: Professeur de Sciences — "Inflige 1 dégât à un Métier ciblé."
  {
    cardId: 'tc-004',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Damage, target: TargetType.AnyJob, value: 1, description: 'Inflige 1 degat a un Metier cible' }],
  },
  // tc-005: Conseiller d'Orientation — "Restaure 1 Réputation par tour."
  {
    cardId: 'tc-005',
    trigger: EffectTrigger.OnTurnStart,
    effects: [{ type: EffectType.Heal, target: TargetType.None, value: 1, description: 'Restaure 1 Reputation' }],
  },
  // tc-008: Directeur d'École — "Tous Enseignement gagnent +1/+0 et restaurent 1 Réputation quand embauchés."
  {
    cardId: 'tc-008',
    trigger: EffectTrigger.OnHire,
    effects: [
      { type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 0, permanent: true, description: 'Tous les Metiers Enseignement gagnent +1/+0' },
      { type: EffectType.Heal, target: TargetType.None, value: 1, description: 'Restaure 1 Reputation' },
    ],
  },
  // tc-011: Journée Pédagogique — "Tous Enseignement gagnent +1/+1 jusqu'à fin du tour."
  {
    cardId: 'tc-011',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 1, description: 'Tous les Metiers Enseignement gagnent +1/+1 ce tour' }],
  },
  // tc-014: Documentaliste — "Quand embauché : Piochez 1 carte."
  {
    cardId: 'tc-014',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' }],
  },
  // tc-024: Manuel Scolaire — "+1/+0 permanent à un Métier Enseignement."
  {
    cardId: 'tc-024',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 0, permanent: true, description: '+1/+0 permanent a un Metier allie' }],
  },

  // ==================== HEALTH ====================

  // he-001: Aide-Soignant — "Quand embauché : Restaurez 1 Réputation."
  {
    cardId: 'he-001',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Heal, target: TargetType.None, value: 1, description: 'Restaure 1 Reputation' }],
  },
  // he-003: Médecin Généraliste — "Quand embauché : Restaurez 2 Réputation."
  {
    cardId: 'he-003',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Heal, target: TargetType.None, value: 2, description: 'Restaure 2 Reputation' }],
  },
  // he-004: Chirurgien — "Inflige 2 dégâts à un Métier ciblé."
  {
    cardId: 'he-004',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Damage, target: TargetType.AnyJob, value: 2, description: 'Inflige 2 degats a un Metier cible' }],
  },
  // he-008: Directeur d'Hôpital — "Tous Santé restaurent 1 Réputation par tour."
  {
    cardId: 'he-008',
    trigger: EffectTrigger.OnTurnStart,
    effects: [{ type: EffectType.Heal, target: TargetType.None, value: 1, description: 'Restaure 1 Reputation' }],
  },
  // he-036: Don du Sang — "Restaurez 3 Réputation. Chaque joueur pioche 1 carte."
  {
    cardId: 'he-036',
    trigger: EffectTrigger.OnCast,
    effects: [
      { type: EffectType.Heal, target: TargetType.None, value: 3, description: 'Restaure 3 Reputation' },
      { type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' },
    ],
  },

  // ==================== MILITARY ====================

  // mi-006: Commandant — "Tous les Métiers Armée gagnent +1/+0."
  {
    cardId: 'mi-006',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 0, permanent: true, description: 'Tous les Metiers Armee gagnent +1/+0' }],
  },
  // mi-008: Général — "Tous les Métiers Armée gagnent +1/+1."
  {
    cardId: 'mi-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 1, permanent: true, description: 'Tous les Metiers Armee gagnent +1/+1' }],
  },
  // mi-019: Sous-Officier — "Quand attaque : un Métier Armée allié gagne +1/+1 ce tour."
  {
    cardId: 'mi-019',
    trigger: EffectTrigger.OnAttack,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 1, description: '+1/+1 a un Metier Armee allie ce tour' }],
  },
  // mi-026: Ration de Combat — "+0/+2 à un Métier Armée. Piochez 1 carte."
  {
    cardId: 'mi-026',
    trigger: EffectTrigger.OnHire,
    effects: [
      { type: EffectType.Buff, target: TargetType.AllyJob, value: 0, value2: 2, description: '+0/+2 a un Metier allie' },
      { type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' },
    ],
  },
  // mi-035: Embuscade — "Infligez 2 dégâts à chaque Métier attaquant."
  {
    cardId: 'mi-035',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Damage, target: TargetType.AllEnemyJobs, value: 2, description: 'Inflige 2 degats a chaque Metier attaquant' }],
  },

  // ==================== JUSTICE ====================

  // ju-003: Procureur — "Un Métier adverse perd -1/-0 en permanence."
  {
    cardId: 'ju-003',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Debuff, target: TargetType.EnemyJob, value: -1, value2: 0, permanent: true, description: '-1/-0 permanent a un Metier adverse' }],
  },
  // ju-004: Juge d'Instruction — "Engagez un Métier ciblé."
  {
    cardId: 'ju-004',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Tap, target: TargetType.EnemyJob, value: 0, description: 'Engage un Metier adverse' }],
  },
  // ju-008: Garde des Sceaux — "Tous Métiers Justice gagnent +0/+2."
  {
    cardId: 'ju-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 0, value2: 2, permanent: true, description: 'Tous les Metiers Justice gagnent +0/+2' }],
  },
  // ju-035: Non-Lieu — "Annulez un Événement adverse. Piochez 1 carte." (only draw part automated)
  {
    cardId: 'ju-035',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' }],
  },

  // ==================== FIREFIGHTER ====================

  // ff-002: Pompier Volontaire — "Gagnez +1 Budget au prochain tour."
  {
    cardId: 'ff-002',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Budget, target: TargetType.None, value: 1, description: '+1 Budget' }],
  },
  // ff-006: Démineur — "Détruisez un Outil adverse."
  {
    cardId: 'ff-006',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Destroy, target: TargetType.EnemyTool, value: 0, description: 'Detruit un Outil adverse' }],
  },
  // ff-008: Colonel des Pompiers — "Les Métiers Pompiers gagnent +1/+1."
  {
    cardId: 'ff-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 1, permanent: true, description: 'Les Metiers Pompiers gagnent +1/+1' }],
  },
  // ff-012: Caporal-Chef — "Un Métier Pompier allié gagne +1/+0 ce tour."
  {
    cardId: 'ff-012',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 0, description: '+1/+0 a un Metier Pompier allie ce tour' }],
  },
  // ff-024: Hache d'Incendie — "+2/+0 au Métier équipé."
  {
    cardId: 'ff-024',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 2, value2: 0, permanent: true, description: '+2/+0 a un Metier allie' }],
  },
  // ff-034: Alerte Rouge — "Tous Pompiers alliés gagnent +2/+0 ce tour."
  {
    cardId: 'ff-034',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 2, value2: 0, description: 'Tous les Metiers Pompiers gagnent +2/+0 ce tour' }],
  },

  // ==================== FINANCE ====================

  // fi-001: Caissier — "Quand embauché : Gagnez +1 Budget."
  {
    cardId: 'fi-001',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Budget, target: TargetType.None, value: 1, description: '+1 Budget' }],
  },
  // fi-002: Comptable — "Gagnez +1 Budget au début de chacun de vos tours."
  {
    cardId: 'fi-002',
    trigger: EffectTrigger.OnTurnStart,
    effects: [{ type: EffectType.Budget, target: TargetType.None, value: 1, description: '+1 Budget' }],
  },
  // fi-006: Trader — "+2/+0 si budget >= 5."
  {
    cardId: 'fi-006',
    trigger: EffectTrigger.WhileInPlay,
    effects: [{
      type: EffectType.Buff,
      target: TargetType.Self,
      value: 2,
      value2: 0,
      condition: { type: 'minBudget', value: 5 },
      description: '+2/+0 si vous avez 5+ Budget',
    }],
  },
  // fi-008: Directeur de Banque — "Tous Finance gagnent +1/+0. +2 Budget par tour."
  {
    cardId: 'fi-008',
    trigger: EffectTrigger.OnHire,
    effects: [{ type: EffectType.Buff, target: TargetType.AllAllyJobs, value: 1, value2: 0, permanent: true, description: 'Tous les Metiers Finance gagnent +1/+0' }],
  },
  {
    cardId: 'fi-008',
    trigger: EffectTrigger.OnTurnStart,
    effects: [{ type: EffectType.Budget, target: TargetType.None, value: 2, description: '+2 Budget' }],
  },
  // fi-038: Subvention d'État — "Gagnez +4 Budget. Piochez 1 carte."
  {
    cardId: 'fi-038',
    trigger: EffectTrigger.OnCast,
    effects: [
      { type: EffectType.Budget, target: TargetType.None, value: 4, description: '+4 Budget' },
      { type: EffectType.Draw, target: TargetType.None, value: 1, description: 'Pioche 1 carte' },
    ],
  },

  // ==================== UNIVERSAL EVENTS ====================

  // ev-006: Formation Continue — "+1/+1 permanent à un Métier ciblé."
  {
    cardId: 'ev-006',
    trigger: EffectTrigger.OnCast,
    effects: [{ type: EffectType.Buff, target: TargetType.AllyJob, value: 1, value2: 1, permanent: true, description: '+1/+1 permanent a un Metier cible' }],
  },
];
