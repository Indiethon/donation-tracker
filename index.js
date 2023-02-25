
const fs = require('fs');
const path = require('path');
const http = require('http')
const https = require('https')
const Tracker = require('./lib/tracker/tracker');
const taskScheduler = require('./lib/taskScheduler/taskScheduler');
const betterLogging = require('better-logging');

const { MessageConstructionStrategy } = betterLogging;
betterLogging(console, {
  messageConstructionStrategy: MessageConstructionStrategy.NONE,
});

// Uncomment below for debug logging
// betterLogging(console, {
//   logLevels: {
//     debug: 0,
//     error: 0,
//     info: 0,
//     line: 0,
//     log: 0,
//     warn: 0,
//   }
// });

let startTime = Date.now();

console.debug("Debug logging enabled!")
console.info(`Starting donation tracker (running on Node.JS ${process.version})`)

// Set the program's base directory.
global.__rootdir = __dirname;

// Create the tracker and database objects.
console.debug("Creating tracker object...")
new Tracker(start);

// Wait for tracker object to initialize.
function start(tracker, database) {

  console.debug("Tracker loaded successfully!")

  // Check for valid currency.
  console.debug('Checking currensies...')
  if (tracker.currencies[tracker.config.paypal.currency] === undefined) {
    console.error('Currency is invalid. Please make sure it\'s ISO 4217 compliant and compatible with Paypal.')
    console.error('A list of compatible currencies can be found at https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/')
    process.exit();
  }

  // Set up SSL (if enabled)
  console.debug('Setting up SSL...')
  if (tracker.config.ssl.enabled) https.createServer({
    key: fs.readFileSync(tracker.config.ssl.keyPath, 'utf8'),
    cert: fs.readFileSync(tracker.config.ssl.certPath, 'utf8')
  }, tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
  else http.createServer(tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));

  if (tracker.config.googleAnalytics.enabled) console.info(`Google Analytics tracking has been enabled with Measurment ID ${tracker.config.googleAnalytics.measurmentId}.`)


  // Setting up task scheduler...
  taskScheduler.start();

  console.debug('Tracker start up complete!');
  console.debug(`Startup time: ${Date.now() - startTime}ms`)
}