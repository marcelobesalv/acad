export const EQUIPMENT_OPTIONS = [
  { key: 'machine', label: 'Machine' },
  { key: 'dumbbell', label: 'Dumbbell' },
  { key: 'barbell', label: 'Barbell' },
];

export function getEquipmentLabel(key) {
  return EQUIPMENT_OPTIONS.find(option => option.key === key)?.label || '';
}
