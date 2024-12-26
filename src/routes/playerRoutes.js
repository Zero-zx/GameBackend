const express = require('express');
const router = express.Router();
const playerController = require('../controllers/PlayerController');

router.get('/rankingsByElo', playerController.getRankingsByElo);
router.get('/rankingsByWins', playerController.getRankingsByWins);
router.get('/rankingsByWinrate', playerController.getRankingsByWinrate);
router.get('/playerStat/:playerId', playerController.getPlayerStats);
router.get('/playerStat/:playerId/match/:matchId', playerController.getPlayerStatByMatchId);

module.exports = router;
