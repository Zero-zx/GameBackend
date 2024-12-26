require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const matchRoutes = require('./routes/MatchRoutes');
const playerRoutes = require('./routes/PlayerRoutes');
const errorHandler = require('./middleware/errorhandler');
const seedDatabase = require('./utils/seedData');
const createSocketServer = require('./controllers/chatController');
const http = require('http');

const app = express();
app.use(express.json());

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);

app.use(errorHandler);

// seedDatabase();

const server = http.createServer(app);

createSocketServer.createSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
