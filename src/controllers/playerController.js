const { db } = require('../config/database');

// Utility to calculate aggregated data
const calculateWinRate = (wins, totalMatches) =>
  totalMatches > 0 ? (wins / totalMatches * 100).toFixed(2) : '0.00';

const aggregatePlayerStats = (playerMatchStats) => {
  const totalGoals = playerMatchStats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
  const totalPasses = playerMatchStats.reduce((sum, stat) => sum + (stat.passes || 0), 0);
  const totalShots = playerMatchStats.reduce((sum, stat) => sum + (stat.shots || 0), 0);

  return { totalGoals, totalPasses, totalShots };
};

exports.getPlayerStats = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    // Fetch the player details
    const playerSnapshot = await db.ref(`players/${playerId}`).once('value');
    const playerData = playerSnapshot.val();

    if (!playerData) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const matchStatsSnapshot = await db.ref('matchStats').once('value');
    const matchStats = matchStatsSnapshot.val();
    const playerMatchStats = Object.values(matchStats).filter(stat => stat.playerId === playerId);

    const { totalGoals, totalPasses, totalShots } = aggregatePlayerStats(playerMatchStats);

    res.json({
      username: playerData.username,
      eloRating: playerData.eloRating,
      wins: playerData.wins || 0,
      total_matches: playerMatchStats.length,
      totalGoals,
      totalPasses,
      totalShots
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPlayerStatByMatchId = async (req, res) => {
  try {
    const { playerId, matchId } = req.params;

    // Fetch match stats from the database
    const matchStatsSnapshot = await db.ref('matchStats').once('value');
    const matchStats = matchStatsSnapshot.val();

    if (!matchStats) {
      return res.status(404).json({ error: 'Match stats not found' });
    }

    // Find the match statistics for the specific player and matchId
    const playerMatchStat = Object.values(matchStats).find(
      (stat) => stat.playerId === playerId && stat.matchId === matchId
    );

    if (!playerMatchStat) {
      return res.status(404).json({ error: 'Player not found in this match' });
    }

    const { goals, passes, shots } = playerMatchStat;

    // Return the player's stats for the specified match
    res.json({
      playerId,
      matchId,
      goals: goals || 0,
      passes: passes || 0,
      shots: shots || 0
    });

  } catch (error) {
    console.error('Error fetching player stats by match ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRankingsByElo = async (req, res) => {
  try {
    const playersSnapshot = await db.ref('players').once('value');
    const matchStatsSnapshot = await db.ref('matchStats').once('value');

    const players = playersSnapshot.val();
    const matchStats = matchStatsSnapshot.val();

    if (!players || !matchStats) {
      return res.json([]);
    }

    const playerStats = Object.entries(players).map(([playerId, playerData]) => {
      const playerMatchStats = Object.values(matchStats).filter(stat => stat.playerId === playerId);
      const totalMatches = playerMatchStats.length;
      const wins = playerMatchStats.filter(stat => stat.isWinner).length;

      return {
        id: playerId,
        ...playerData,
        wins,
        total_matches: totalMatches,
        winRate: calculateWinRate(wins, totalMatches)
      };
    });

    // Sort by Elo rating
    const rankings = playerStats.sort((a, b) => b.eloRating - a.eloRating);

    res.json(rankings);
  } catch (error) {
    console.error('Error fetching Elo rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRankingsByWins = async (req, res) => {
  try {
    const playersSnapshot = await db.ref('players').once('value');
    const matchStatsSnapshot = await db.ref('matchStats').once('value');

    const players = playersSnapshot.val();
    const matchStats = matchStatsSnapshot.val();

    if (!players || !matchStats) {
      return res.json([]);
    }

    const playerStats = Object.entries(players).map(([playerId, playerData]) => {
      const playerMatchStats = Object.values(matchStats).filter(stat => stat.playerId === playerId);
      const totalMatches = playerMatchStats.length;
      const wins = playerMatchStats.filter(stat => stat.isWinner).length;

      return {
        id: playerId,
        ...playerData,
        wins,
        total_matches: totalMatches,
        winRate: calculateWinRate(wins, totalMatches)
      };
    });

    const rankings = playerStats.sort((a, b) => b.wins - a.wins);

    res.json(rankings);
  } catch (error) {
    console.error('Error fetching win rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRankingsByWinrate = async (req, res) => {
  try {
    const playersSnapshot = await db.ref('players').once('value');
    const matchStatsSnapshot = await db.ref('matchStats').once('value');

    const players = playersSnapshot.val();
    const matchStats = matchStatsSnapshot.val();

    if (!players || !matchStats) {
      return res.json([]);
    }

    const playerStats = Object.entries(players).map(([playerId, playerData]) => {
      const playerMatchStats = Object.values(matchStats).filter(stat => stat.playerId === playerId);
      const totalMatches = playerMatchStats.length;
      const wins = playerMatchStats.filter(stat => stat.isWinner).length;

      return {
        id: playerId,
        ...playerData,
        wins,
        total_matches: totalMatches,
        winRate: calculateWinRate(wins, totalMatches)
      };
    });

    const rankings = playerStats.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    res.json(rankings);
  } catch (error) {
    console.error('Error fetching win rate rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
