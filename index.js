
const fs = require('fs');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const config = require('./config.json');
require('better-logging')(console);

// Connect to the database.
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${config.tracker.databaseURL}`);
mongoose.connection.on("connected", () => console.info(`Connected to database at mongodb://${config.tracker.databaseURL}`))
mongoose.connection.on("disconnected", () => console.error('Disconnected from database. Please check your internet connection.'))

// Set up global variables.
const app = express();
let tracker = { app: {}, config: {}, database: {}, modules: {} };
tracker.app = app;
tracker.config = config;
tracker.database = mongoose;

// Set up database collections.
tracker.database.User = mongoose.model('test/amazing', require('./schemas/user'))
tracker.database.Event = mongoose.model('Event', require('./schemas/event'))

// Load modules.
const modules = fs.readdirSync('./modules');
modules.forEach(module => {
  tracker.modules[module] = require(`./modules/${module}/index.js`)
  try { tracker.modules[module](tracker) } catch(e) { console.error(`Error when loading module ${module}. ${e}`) }
});

// Set up express web server.
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(express.text())
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/pages'));

// Basic Routes
app.get("/donate", (req, res) => res.render('donate/index', { useSandbox: tracker.config.paypal.useSandbox, baseURL: tracker.config.baseURL, port: tracker.config.port, ssl: tracker.config.ssl.enabled }));
app.get('/donate/process', (req, res) => {
  if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
})

app.get("/donate/success", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/success.html')));

app.get('*', (req, res) => res.status(404).send('Page not found.'));

let trackerURL;
switch (tracker.config.ssl.enabled) {
  case true: trackerURL = `https://${tracker.config.baseURL}`; break;
  case false: trackerURL = `http://${tracker.config.baseURL}:${tracker.config.port}`; break;
}
app.listen(tracker.config.port, () => console.info(`Donation tracker is running at ${trackerURL}`));