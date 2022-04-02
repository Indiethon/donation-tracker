
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
  // database.tracker.User = mongoose.model('User', require('./schemas/user'))
  // database.tracker.Event = mongoose.model('Event', require('./schemas/event'))
  // database.tracker.Donation = mongoose.model('Donation', require('./schemas/donation'))


  // Set up express web server.
  // tracker.server.engine('html', require('ejs').renderFile);
  // tracker.server.set('view engine', 'html');
  // tracker.server.set('views', path.join(__dirname, '/pages'));

  // Set up SSL (if enabled)
  if (tracker.config.ssl.enabled) https.createServer({
    key: fs.readFileSync(tracker.config.ssl.keyPath, 'utf8'),
    cert: fs.readFileSync(tracker.config.ssl.certPath, 'utf8')
  }, tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));
  else http.createServer(tracker.server).listen(tracker.config.port, () => console.info(`Donation tracker is running at ${tracker.url}`));

  // Basic Routes
  // tracker.server.get("/donate", (req, res) => res.render('donate/index', { useSandbox: tracker.config.paypal.useSandbox, apiUrl: tracker.url }));
  // tracker.server.get('/donate/process', (req, res) => {
  //   if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
  // })

  // tracker.server.get("/donate/success", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/success.html')));

  // tracker.server.get('*', (req, res) => res.status(404).send('Page not found.'));
}


/*

// Set up global variables.
const tracker.server = express();
tracker.server.use(express.urlencoded({ extended: false }));
tracker.server.use(express.json())
tracker.server.use(express.text())
//let tracker = { tracker.server: {}, config: {}, modules: {} };
let database = {};
// tracker.tracker.server = tracker.server;
// tracker.config = config;
database.tracker = mongoose;

// Set up database collections.
database.tracker.User = mongoose.model('User', require('./schemas/user'))
database.tracker.Event = mongoose.model('Event', require('./schemas/event'))
database.tracker.Donation = mongoose.model('Donation', require('./schemas/donation'))
setTimeout(() => database.tracker.Test = mongoose.model('Test', { test: Boolean }), 10000)

// database.tracker.Event.find({}, (err, events) => {
//   console.log(events)
// })

// Load modules.


const modules = fs.readdirSync('./modules');
modules.forEach(module => {
  tracker.modules[module] = require(`./modules/${module}/index.js`)
  try { tracker.modules[module](tracker, database) } catch(e) { console.error(`Error when loading module ${module}. ${e}`) }
});

*/

