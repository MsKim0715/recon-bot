const TIER_COLORS: Record<number, number> = {
  0:  0x5c5c5c,  // Unrated
  1:  0x5c5c5c,  // Iron 1
  2:  0x5c5c5c,  // Iron 2
  3:  0x5c5c5c,  // Iron 3
  4:  0x8B4513,  // Bronze 1
  5:  0x8B4513,  // Bronze 2
  6:  0x8B4513,  // Bronze 3
  7:  0xC0C0C0,  // Silver 1
  8:  0xC0C0C0,  // Silver 2
  9:  0xC0C0C0,  // Silver 3
  10: 0xFFD700,  // Gold 1
  11: 0xFFD700,  // Gold 2
  12: 0xFFD700,  // Gold 3
  13: 0x00CED1,  // Platinum 1
  14: 0x00CED1,  // Platinum 2
  15: 0x00CED1,  // Platinum 3
  16: 0x00BFFF,  // Diamond 1
  17: 0x00BFFF,  // Diamond 2
  18: 0x00BFFF,  // Diamond 3
  19: 0xFF4500,  // Ascendant 1
  20: 0xFF4500,  // Ascendant 2
  21: 0xFF4500,  // Ascendant 3
  22: 0xFF0000,  // Immortal 1
  23: 0xFF0000,  // Immortal 2
  24: 0xFF0000,  // Immortal 3
  25: 0xFFFF00,  // Radiant
};

export function getTierColor(avgTier: number): number {
  return TIER_COLORS[Math.round(avgTier)] ?? 0x5865F2;
}