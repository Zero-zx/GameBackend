const admin = require('firebase-admin');
const serviceAccount = require('../../config/firebase-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

module.exports = {
  db,
  admin
};