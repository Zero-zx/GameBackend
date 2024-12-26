const { db, admin } = require('../config/database');
const { calculateNewRating } = require('../utils/eloCalculator');

exports.getRecentMatches = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Query match stats for the player
    const matchStatRef = db.ref('matchStats')
      .orderByChild('playerId')
      .equalTo(playerId);

    const matchStatSnap = await matchStatRef.once('value');
    const matchStats = matchStatSnap.val();

    if (!matchStats) {
      return res.status(404).json({ error: 'No match stats found for this player' });
    }

    // Extract matchIds for the player
    const matchIds = Object.values(matchStats).map(stat => stat.matchId);

    // Get the match details for each matchId
    const recentMatches = [];

    for (let matchId of matchIds) {
      // Get the match details from the 'matches' table
      const matchRef = db.ref(`matches/${matchId}`);
      const matchSnap = await matchRef.once('value');
      const matchData = matchSnap.val();

      if (matchData) {
        // Get the player's match stat for this match
        const playerMatchStat = Object.values(matchStats).find(stat => stat.matchId === matchId);

        // Get the opponent's match stat for this match
        const opponentMatchStatRef = db.ref('matchStats')
          .orderByChild('matchId')
          .equalTo(matchId);

        const opponentMatchStatSnap = await opponentMatchStatRef.once('value');
        const opponentMatchStats = opponentMatchStatSnap.val();

        // Find the opponent's stat (playerId !== current playerId)
        const opponentMatchStatKey = Object.keys(opponentMatchStats).find(key => {
          return opponentMatchStats[key].playerId !== playerId;
        });

        const opponentMatchStat = opponentMatchStats[opponentMatchStatKey];

        // Fetch opponent details (username)
        const opponentRef = db.ref(`players/${opponentMatchStat.playerId}`);
        const opponentSnap = await opponentRef.once('value');
        const opponentName = opponentSnap.val()?.username || 'Unknown Opponent';

        // Push to the recent matches array, including isWinner for the player
        recentMatches.push({
          matchId,
          opponentName,
          date: matchData.date,
          isWinner: playerMatchStat.isWinner, // Include the player's isWinner status
        });
      }
    }
    recentMatches.sort((a, b) => {
      const dateA = new Date(a.date); // Convert date string to Date object
      const dateB = new Date(b.date); // Convert date string to Date object
      return dateB - dateA; // Sort in descending order
    });
    res.json(recentMatches);
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getPlayerStatsByMatch = async (req, res) => {
  try {
    const { playerId, matchId } = req.params;

    // Get the player's match stats for the specific matchId
    const matchStatRef = db.ref('matchStats')
      .orderByChild('matchId')
      .equalTo(matchId);

    const matchStatSnap = await matchStatRef.once('value');
    const matchStats = matchStatSnap.val();

    if (!matchStats) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Find the player's match stat
    const playerMatchStat = Object.values(matchStats).find(stat => stat.playerId === playerId);

    if (!playerMatchStat) {
      return res.status(404).json({ error: 'Player match stat not found' });
    }

    // Prepare the response with the player's match stats
    const playerMatchDetails = {
      matchId,
      goals: playerMatchStat.goals,
      passes: playerMatchStat.passes,
      shots: playerMatchStat.shots,
      isWinner: playerMatchStat.isWinner,
    };

    res.json(playerMatchDetails);
  } catch (error) {
    console.error('Error fetching player stats for the match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.submitMatchResult = async (req, res) => {
  console.log('Incoming match data:', req.body);
  try {
    const matchData = req.body;
    const matchRef = db.ref('matches').push();
    const matchId = matchRef.key;

    if (!matchData.player1 || !matchData.player2) {
      return res.status(400).json({ error: 'Invalid match data' });
    }

    await matchRef.set({
      date: admin.database.ServerValue.TIMESTAMP
    });

    const player1Ref = db.ref(`players/${matchData.player1.id}`);
    const player2Ref = db.ref(`players/${matchData.player2.id}`);

    const [player1Snap, player2Snap] = await Promise.all([
      player1Ref.once('value'),
      player2Ref.once('value')
    ]);

    const player1 = player1Snap.val() || { eloRating: 1200, wins: 0, total_matches: 0 };
    const player2 = player2Snap.val() || { eloRating: 1200, wins: 0, total_matches: 0 };

    const player1Won = matchData.player1.isWinner;
    const newElo1 = calculateNewRating(
      player1.eloRating,
      player2.eloRating,
      player1Won ? 1 : 0
    );
    const newElo2 = calculateNewRating(
      player2.eloRating,
      player1.eloRating,
      player1Won ? 0 : 1
    );

    const updates = {};
    
    updates[`players/${matchData.player1.id}`] = {
      eloRating: newElo1,
      wins: player1.wins + (player1Won ? 1 : 0),
      total_matches: player1.total_matches + 1
    };

    updates[`players/${matchData.player2.id}`] = {
      eloRating: newElo2,
      wins: player2.wins + (!player1Won ? 1 : 0),
      total_matches: player2.total_matches + 1
    };

    updates[`matchStats/${matchId}/${matchData.player1.id}`] = {
      passes: matchData.player1.passes,
      goals: matchData.player1.goals,
      shots: matchData.player1.shots,
      isWinner: matchData.player1.isWinner
    };

    updates[`matchStats/${matchId}/${matchData.player2.id}`] = {
      passes: matchData.player2.passes,
      goals: matchData.player2.goals,
      shots: matchData.player2.shots,
      isWinner: matchData.player2.isWinner
    };

    await db.ref().update(updates);

    res.json({
      success: true,
      matchId,
      player1NewRating: newElo1,
      player2NewRating: newElo2
    });
  } catch (error) {
    console.error('Error submitting match result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};