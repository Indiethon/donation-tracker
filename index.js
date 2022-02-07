const express = require('express');
const path = require('path')
const config = require('./config.json')
const fetch = require('node-fetch');
const api = require('./api/index');
const fs = require('fs')
let tracker = { app: {}, modules: {}};

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(express.text())
tracker.app = app;


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


// Load API
api.load(tracker);


// Basic Routes
app.get("/donate", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/index.html')));
app.get('/donate/process', (req, res) => {
  if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
})

app.get("/donate/success", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/success.html')));

app.get('*', (req, res) => res.status(404).send('Page not found.'));

app.listen(3000, () => console.log(`Listening at port 3000`));