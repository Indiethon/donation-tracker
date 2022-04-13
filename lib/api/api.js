const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const charity = require('./charity')
const donation = require('./donation')
const event = require('./event');
const user = require('./user');

//console.log(apiKeys[0]);

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = ['/api/donation/create', '/api/donation/ipn', '/api/login']

    // Start modules.
    charity.load(tracker, database);
    donation.load(tracker, database);
    event.load(tracker, database);
    user.load(tracker, database);

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

    // Unsecured API routes.
    app.post('/api/donation/create', (req, res) => donation.createDonation(req, res))
    app.post('/api/donation/ipn', (req, res) => donation.verifyIPN(req, res))
    app.post('/api/login', (req, res) => login(req, res));
    app.get('/api/events/list', (req, res) => event.generateEventList(req, res))

    // Secured API endpoints.
    app.get('/api/verify', (req, res) => res.status(200).send({ message: 'Logged in!' }));
    app.get('/api/logout', (req, res) => logout(req, res))

    // Events
    app.get('/api/events', (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/active', (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/:id', (req, res) => event.fetchEvent(req, res))
    app.post('/api/events', (req, res) => event.updateEvent(req, res))
    app.post('/api/events/:id', (req, res) => event.updateEvent(req, res))
    app.delete('/api/events/:id', (req, res) => event.deleteEvent(req, res))

    // Charities
    app.get('/api/charities', (req, res) => charity.fetchCharity(req, res))
    app.get('/api/charities/:id', (req, res) => charity.fetchCharity(req, res))
    app.post('/api/charities', (req, res) => charity.updateCharity(req, res))
    app.post('/api/charities/:id', (req, res) => charity.updateCharity(req, res))
    app.delete('/api/charities/:id', (req, res) => charity.deleteCharity(req, res))

    // Users
    app.get('/api/users', (req, res) => user.fetchUser(req, res))
    app.get('/api/users/:id', (req, res) => user.fetchUser(req, res))
    app.post('/api/users', (req, res) => user.updateUser(req, res))
    app.post('/api/users/:id', (req, res) => user.updateUser(req, res))
    app.delete('/api/users/:id', (req, res) => user.deleteUser(req, res))

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

    function fetchCharity(req, res) {
        let charityList = [];
        database.findAll('charity', {}, (err, data) => {
            if (err) return res.status(500).send({ error: 'Error when fetching charity data.' })
            if (data === undefined) return res.status(200).send([]);
            let sortecCharities = data.sort((a, b) => b.endDate - a.endDate)
            for (const charity of sortecCharities) {
                charityList.push(charity)
            }
            res.status(200).send(charityList)
        })
    }
   
}