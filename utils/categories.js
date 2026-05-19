export const CATEGORIES = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Toll', 'Tax', 'Other'];

export function categoryLabel(cat, t) {
  return t ? t(`categories.${cat}`) : cat;
}
