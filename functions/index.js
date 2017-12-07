const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const express = require('express'),
  path = require('path'),
  fs = require('fs'),
  app = express();
PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'app')));
const server = app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

app.get('/data', (req, res) => {
  res.sendFile(__dirname + '/data/radar-config.json');
});
