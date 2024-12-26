const K_FACTOR = 32;

const calculateExpectedScore = (playerRating, opponentRating) => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

const calculateNewRating = (playerRating, opponentRating, actualScore) => {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(playerRating + K_FACTOR * (actualScore - expectedScore));
};

module.exports = {
  calculateNewRating
};