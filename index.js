const express = require('express');
const path = require('path')
const fetch = require('node-fetch');
const api = require('./api/index');
const config = require('./config.json')
const fs = require('fs')
let tracker = { app: {}, config: {}, modules: {} };

const app = express();
tracker.app = app;
tracker.config = config;

// Start modules.
const modules = fs.readdirSync('./modules');
modules.forEach(module => tracker.modules[module] = require(`./modules/${module}/index.js`));
modules.forEach(module => tracker.modules[module](tracker))

// try {
//   let index = require(`./modules/${module}/index.js`);
//   tracker.modules[module] = require(`./modules/${module}/index.js`);
//   index(app);
// } catch(e) {
//   console.log(e)
//   console.error(`Error when loading module ${module}. Make sure it has a index.js file!`);
// }

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(express.text())
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/pages'));

// Load API
api.load(tracker);

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
app.listen(tracker.config.port, () => console.log(`Donation tracker is running at ${trackerURL}`));