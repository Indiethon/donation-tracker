
const fs = require('fs');
const path = require('path');
const http = require('http')
const https = require('https')
const Tracker = require('./lib/tracker/tracker');
require('better-logging')(console);

console.info(`Starting donation tracker (running on Node.JS ${process.version})`)

// Set the program's base directory.
global.__rootdir = __dirname;


// Create the tracker and database objects.
new Tracker(start);

// Wait for tracker object to initialize.
function start(tracker, database) {

  // Check for valid currency.
  if (currencies[tracker.config.paypal.currency] === undefined) {
    console.error('Currency is invalid. Please make sure it\'s ISO 4217 compliant and compatible with Paypal.')
    console.error('A list of compatible currencies can be found at https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/')
    process.exit();
  }

  // Set up SSL (if enabled)
  if (tracker.config.ssl.enabled) https.createServer({
    key: fs.readFile(tracker.config.ssl.keyPath, 'utf8'),
    cert: fs.readFile(tracker.config.ssl.certPath, 'utf8')
  }, tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
  else http.createServer(tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
}

const currencies = {
  'AUD': 'A$',
  'BRL': 'R$',
  'CAD': 'CA$',
  'CNY': 'CNY',
  'CZK': 'Kč',
  'DKK': 'kr',
  'EUR': '€',
  'HKD': 'HK$',
  'HUF': 'Ft',
  'ILS': '₪',
  'JPY': '¥',
  'MYR': 'RM',
  'MXN': 'MX$',
  'TWD': 'NT$',
  'NZD': 'NZ$',
  'NOK': 'kr',
  'PHP': '₱',
  'PLN': 'zł',
  'GBP': '£',
  'RUB': '₽',
  'SGD': 'S$',
  'SEK': 'kr',
  'CHF': 'CHF',
  'THB': '฿',
  'USD': '$',
}