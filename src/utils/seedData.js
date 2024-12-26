const faker = require('faker');
const {db, admin} = require('../config/database');

// Generate a fake player
const generateFakePlayer = () => ({
  username: faker.internet.userName(),
  eloRating: faker.datatype.number({ min: 1000, max: 2500 }),
});

// Generate a fake match
const generateFakeMatch = () => ({
  date: faker.date.between('2023-01-01', '2024-12-31').toISOString(),
});

// Generate fake match statistics
const generateFakeMatchStat = (matchId, playerId) => ({
  matchId,
  playerId,
  goals: faker.datatype.number({ min: 0, max: 5 }),
  passes: faker.datatype.number({ min: 0, max: 50 }),
  shots: faker.datatype.number({ min: 0, max: 20 }),
  isWinner: faker.datatype.boolean(),
});

const seedDatabase = async () => {
  try {
    // Step 1: Generate fake players
    const players = Array.from({ length: 100 }, () => ({
      id: faker.datatype.uuid(),
      ...generateFakePlayer(),
    }));

    // Step 2: Generate fake matches
    const matches = Array.from({ length: 50 }, () => ({
      id: faker.datatype.uuid(),
      ...generateFakeMatch(),
    }));

    // Step 3: Generate fake match stats
    const matchStats = [];
    matches.forEach((match) => {
      const numPlayersInMatch = faker.datatype.number({ min: 2, max: 10 });
      const participatingPlayers = faker.helpers.shuffle(players).slice(0, numPlayersInMatch);

      participatingPlayers.forEach((player) => {
        matchStats.push({
          id: faker.datatype.uuid(),
          ...generateFakeMatchStat(match.id, player.id),
        });
      });
    });

    // Step 4: Save data to the database
    const playerUpdates = players.reduce((updates, player) => {
      updates[`players/${player.id}`] = player;
      return updates;
    }, {});

    const matchUpdates = matches.reduce((updates, match) => {
      updates[`matches/${match.id}`] = match;
      return updates;
    }, {});

    const matchStatUpdates = matchStats.reduce((updates, stat) => {
      updates[`matchStats/${stat.id}`] = stat;
      return updates;
    }, {});

    // Update database
    await db.ref().update({
      ...playerUpdates,
      ...matchUpdates,
      ...matchStatUpdates,
    });

    console.log('Fake data seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
