const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const event = require('./event');

//console.log(apiKeys[0]);

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = ['/api/donation/create', '/api/donation/ipn', '/api/login']

    // Start modules.
    event(tracker, database);

    // Unsecured API routes.
    app.get('/api/donation/create', (req, res) => createDonation(req, res))
    app.post('/api/donation/ipn', (req, res) => tracker.modules.donation.verifyIPN(req, res))
    app.post('/api/login', (req, res) => login(req, res));
    app.get('/api/events/list', (req, res) => generateEventList(req, res))

    // Authentication middleware.
    app.use((req, res, next) => {
        if (unsecurePath.includes(req.path) || !req.path.includes('/api/')) { next(); return; }
        if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
        var username = jwt.verify(req.headers.authorization.split(' ')[1], tracker.config.tracker.passwordHash, (error, data) => {
            if (error) { res.status(403).send({ error: 'Invalid token.' }); return; }
            if (tracker.loggedInUsers.includes(data.data.username)) {
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
    app.get('/api/events/all', (req, res) => fetchEvent(req, res))
    app.post('/api/events/create', (req, res) => createEvent(req, res))

    // API functions.
    function login(req, res) {
        database.find('user', { username: req.body.username }, (error, result) => {
            if (error) return res.status(404).send({ error: 'User not found.' })
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
                    tracker.loggedInUsers.push(result.username)
                    result.lastLogin = Date.now();
                    database.save(result)
                    return res.status(200).send({ username: result.username, id: result.id, token: token })
                }
                return res.status(401).send({ error: 'Incorrect password.' })
            });
        });
    }

    function logout(req, res) {
        tracker.loggedInUsers.splice(tracker.loggedInUsers.indexOf(res.locals.username));
        res.status(200).send({})
    }

    function createDonation(req, res) {
        let donationId = uuid();
        //tracker.modules.donation.pendingDonations.push(donationId)
        // Find active marathon.
        let data = {
            donationId: donationId,
            url: 'https://www.sandbox.paypal.com/donate', // Non-sandbox: https://www.paypal.com/donate
            payee: 'sb-x55mn12091780@business.example.com',
            currency: 'EUR',
        };
        res.status(200).send(data);
    }

    function generateEventList(req, res) {
        let eventList = [];
        database.find('event', {}, (err, data) => {
            let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
            for (const event of sortedEvents) {
                eventList.push(event.name)
            }
            res.status(200).send(eventList)
        })
    }

    function fetchEvent(req, res) {
        let eventList = [];
        database.find('event', {}, (err, data) => {
            let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
            for (const event of sortedEvents) {
                eventList.push(event)
            }
            res.status(200).send(eventList)
        })
    }
}