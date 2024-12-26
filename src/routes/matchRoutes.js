const express = require('express');
const router = express.Router();
const matchController = require('../controllers/MatchController');
const auth = require('../middleware/auth');

router.post('/submit', matchController.submitMatchResult);
router.get('/recentMatches/:playerId', matchController.getRecentMatches);
router.get('/playerStats/:playerId/:matchId', matchController.getPlayerStatsByMatch);

module.exports = router;