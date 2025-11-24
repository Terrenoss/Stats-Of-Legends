export function damageAfterArmor(damage: number, armor: number) {
  const dmgMultiplier = 100 / (100 + armor);
  return damage * dmgMultiplier;
}

export function damageAfterMR(damage: number, mr: number) {
  const dmgMultiplier = 100 / (100 + mr);
  return damage * dmgMultiplier;
}

export function applyArmorPen(damage: number, armorPen: number) {
  return damage; // placeholder
}

export function applyMagicPen(damage: number, magicPen: number) {
  return damage; // placeholder
}

