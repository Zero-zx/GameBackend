const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};