
const fs = require('fs');
const path = require('path');
const http = require('http')
const https = require('https')
const Tracker = require('./lib/tracker/tracker');
const Frontend = require('./frontend/index')
require('better-logging')(console);

console.info(`Starting donation tracker (running on Node.JS ${process.version})`)

// Set the program's base directory.
global.__rootdir = __dirname;

// Create the tracker and database objects.
new Tracker(start);

// Wait for tracker object to initialize.
function start(tracker, database) {

  // Start the front end.
  Frontend.start(tracker, database);

  // Set up SSL (if enabled)
  if (tracker.config.ssl.enabled) https.createServer({
    key: fs.readFileSync(tracker.config.ssl.keyPath, 'utf8'),
    cert: fs.readFileSync(tracker.config.ssl.certPath, 'utf8')
  }, tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
  else http.createServer(tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
}