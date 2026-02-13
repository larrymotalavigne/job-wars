export enum EffectTrigger {
  OnHire = 'onHire',
  OnCast = 'onCast',
  OnDestroy = 'onDestroy',
  OnAttack = 'onAttack',
  OnBlock = 'onBlock',
  OnTurnStart = 'onTurnStart',
  OnTurnEnd = 'onTurnEnd',
  WhileInPlay = 'whileInPlay',
}

export enum EffectType {
  Draw = 'draw',
  Damage = 'damage',
  Buff = 'buff',
  Debuff = 'debuff',
  Heal = 'heal',
  Budget = 'budget',
  Destroy = 'destroy',
  Tap = 'tap',
  Bounce = 'bounce',
}

export enum TargetType {
  None = 'none',
  AllyJob = 'allyJob',
  EnemyJob = 'enemyJob',
  AnyJob = 'anyJob',
  AllyTool = 'allyTool',
  EnemyTool = 'enemyTool',
  Self = 'self',
  AllAllyJobs = 'allAllyJobs',
  AllEnemyJobs = 'allEnemyJobs',
  AllJobs = 'allJobs',
}

export interface EffectDefinition {
  type: EffectType;
  target: TargetType;
  value: number;
  value2?: number;
  permanent?: boolean;
  condition?: EffectCondition;
  description: string;
}

export interface EffectCondition {
  type: 'minAllyCount' | 'minBudget' | 'maxTargetResilience' | 'maxTargetCost';
  domain?: string;
  value: number;
}

export interface CardEffects {
  cardId: string;
  trigger: EffectTrigger;
  effects: EffectDefinition[];
}

export interface PendingEffect {
  sourceInstanceId: string;
  sourceCardName: string;
  effects: EffectDefinition[];
  currentIndex: number;
  ownerId: string;
}
