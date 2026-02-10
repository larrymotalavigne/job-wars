import { Card } from '../models/card.model';
import { IT_CARDS } from './it.cards';
import { URBAN_PLANNING_CARDS } from './urban-planning.cards';
import { TEACHER_CARDS } from './teacher.cards';
import { POLICE_CARDS } from './police.cards';
import { HEALTH_CARDS } from './health.cards';
import { FIREFIGHTER_CARDS } from './firefighter.cards';
import { JUSTICE_CARDS } from './justice.cards';
import { FINANCE_CARDS } from './finance.cards';
import { CRAFTS_CARDS } from './crafts.cards';
import { MILITARY_CARDS } from './military.cards';
import { UNIVERSAL_EVENTS } from './events.cards';

export const ALL_CARDS: Card[] = [
  ...IT_CARDS,
  ...URBAN_PLANNING_CARDS,
  ...TEACHER_CARDS,
  ...POLICE_CARDS,
  ...HEALTH_CARDS,
  ...FIREFIGHTER_CARDS,
  ...JUSTICE_CARDS,
  ...FINANCE_CARDS,
  ...CRAFTS_CARDS,
  ...MILITARY_CARDS,
  ...UNIVERSAL_EVENTS,
];
