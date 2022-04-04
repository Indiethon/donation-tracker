const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const event = require('./event');

//console.log(apiKeys[0]);

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = ['/api/donation/create', '/api/donation/ipn', '/api/login']

    // Start modules.
    event.load(tracker, database);

    // Unsecured API routes.
    app.get('/api/donation/create', (req, res) => createDonation(req, res))
    app.post('/api/donation/ipn', (req, res) => verifyIPN(req, res))
    app.post('/api/login', (req, res) => login(req, res));
    app.get('/api/events/list', (req, res) => generateEventList(req, res))

    // Authentication middleware.
    app.use((req, res, next) => {
        if (unsecurePath.includes(req.path) || !req.path.includes('/api/')) { next(); return; }
        if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
        var session = jwt.verify(req.headers.authorization.split(' ')[1], tracker.config.tracker.passwordHash, (error, data) => {
            if (error) { res.status(403).send({ error: 'Invalid token.' }); return; }
            if (tracker.loggedInUsers.includes(data.data.session)) {
                res.locals.username = data.data.username;
                res.locals.id = data.data.id;
                res.locals.session = data.data.session;
                next();
                return;
            }
            else res.status(401).send({ error: 'Invalid session.' })
        });
    });

    // Secured API endpoints.
    app.get('/api/verify', (req, res) => res.status(200).send({ message: 'Logged in!' }));
    app.get('/api/logout', (req, res) => logout(req, res))

    // Events
    app.get('/api/events/all', (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/active', (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/:event', (req, res) => event.fetchEvent(req, res))
    app.post('/api/events/create', (req, res) => event.createEvent(req, res))
    app.post('/api/events/update', (req, res) => event.updateEvent(req, res))
    app.delete('/api/events/delete/:event', (req, res) => event.deleteEvent(req, res))

    // Charities
    app.get('/api/charities/all', (req, res) => fetchCharity(req, res))

    // API functions.
    function login(req, res) {
        if (req.body.username === undefined || req.body.password === undefined) return res.status(401).send({ error: 'Username or password is incorrect.' })
        database.find('user', { username: req.body.username }, (error, result) => {
            if (error) return res.status(401).send({ error: 'Username or password is incorrect.' })
            bcrypt.compare(req.body.password, result.password, (err, match) => {
                if (match) {
                    let session = uuid();
                    let token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + 86400000,
                        data: {
                            username: result.username,
                            id: result.id,
                            session: session,
                        }
                    }, tracker.config.tracker.passwordHash);
                    tracker.loggedInUsers.push(session)
                    result.lastLogin = Date.now();
                    database.save(result)
                    return res.status(200).send({ username: result.username, id: result.id, token: token })
                }
                return res.status(401).send({ error: 'Username or password is incorrect.' })
            });
        });
    }

    function logout(req, res) {
        tracker.loggedInUsers.splice(res.locals.session);
        res.status(200).send({})
    }

    function generateEventList(req, res) {
        let eventList = [];
        database.findAll('event', {}, (err, data) => {
            let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
            for (const event of sortedEvents) {
                eventList.push(event.name)
            }
            res.status(200).send(eventList)
        })
    }

    function fetchCharity(req, res) {
        let charityList = [];
        database.findAll('charity', {}, (err, data) => {
            if (err) return res.status(500).send({ error: 'Error when fetching charity data.' })
            let sortecCharities = data.sort((a, b) => b.endDate - a.endDate)
            for (const charity of sortecCharities) {
                charityList.push(charity)
            }
            res.status(200).send(charityList)
        })
    }
   
}