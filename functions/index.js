const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const express = require("express"),
  path = require("path"),
  fs = require("fs"),
  app = express();
app.get("/data", (req, res) => {
  let radarConfig = JSON.parse(
      fs.readFileSync(__dirname + "/data/radar-config.json", "utf-8")
    ),
    radarData = JSON.parse(
      fs.readFileSync(__dirname + "/data/radar-data.json", "utf-8")
    ),
    data = Object.assign(radarConfig, radarData);
  res.send(data);
});

exports.app = functions.https.onRequest(app);
