// constants/disposal.ts

import { COLORS } from './theme';

export const DISPOSAL_CATEGORIES = {
  recycle: {
    icon: '♻️',
    color: COLORS.recycle,
    label: 'Recycle',
  },
  trash: {
    icon: '🗑️',
    color: COLORS.trash,
    label: 'Trash',
  },
  compost: {
    icon: '🌱',
    color: COLORS.compost,
    label: 'Compost',
  },
  hazardous: {
    icon: '⚠️',
    color: COLORS.hazardous,
    label: 'Hazardous',
  },
  donate: {
    icon: '💚',
    color: COLORS.donate,
    label: 'Donate',
  },
  dropoff: {
    icon: '📍',
    color: COLORS.primary,
    label: 'Drop-off Required',
  },
} as const;

export type DisposalCategory = keyof typeof DISPOSAL_CATEGORIES;