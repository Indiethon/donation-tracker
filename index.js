const express = require('express');
const path = require('path')
const config = require('./config.json')
const fetch = require('node-fetch');
const api = require('./api/index');
const fs = require('fs')

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

// Load API
api.load(app);

// Start modules.
const modules = fs.readdirSync('./modules');
modules.forEach(module => {
  try {
    let index = require(`./modules/${module}/index.js`);
    global[module] = require(`./modules/${module}/index.js`);
    index();
  } catch(e) {
    console.error(`Error when loading module ${module}. Make sure it has a index.js file!`);
    console.log(e)
  }
})

// Basic Routes
app.get("/donate", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/index.html')));

app.get('/donate/ipn', (req, res) => res.send(200));

app.get('*', (req, res) => res.status(404).send('Page not found.'));

app.listen(3000, () => console.log(`Listening at port 3000`));