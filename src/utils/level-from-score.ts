const XP_REQUIRED = [
  0, 10, 30, 70, 110, 160, 200, 250, 320, 380, 460, 600, 800, 1050, 1300, 1600,
  1950, 2350, 2800, 3300, 3900, 4600, 5600, 6900, 8900, 11000, 14000, 17000,
  21000, 26000, 32000, 40000,
];

const levelFromScore = (score: number) => {
  for (let i = 0; i < XP_REQUIRED.length; i++) {
    if (score < XP_REQUIRED[i]) {
      return i;
    }
  }
  return XP_REQUIRED.length;
};

export default levelFromScore;
