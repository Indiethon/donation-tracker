const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const charity = require('./charity')
const donation = require('./donation')
const event = require('./event');
const incentive = require('./incentive')
const speedrun = require('./speedrun');
const runner = require('./runner')
const user = require('./user');

//console.log(apiKeys[0]);

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = ['/api/donation/create', '/api/donation/ipn', '/api/login', '/api/speedruns/:id', '/api/speedruns/:event', '/api/incentives/:id', '/api/incentives/event/:id', '/api/donation/info']

    // Start modules.
    charity.load(tracker, database);
    donation.load(tracker, database);
    event.load(tracker, database);
    incentive.load(tracker, database);
    runner.load(tracker, database);
    speedrun.load(tracker, database);
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
    app.get('/api/speedruns', (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/speedruns/:id', (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/speedruns/event/:event', (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/incentives/:id', (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/incentives/event/:event', (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/donation/info', (req, res) => sendDonationInfo(req, res))

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

    // Speedruns
    app.post('/api/speedruns', (req, res) => speedrun.updateSpeedrun(req, res))
    app.post('/api/speedruns/:id', (req, res) => speedrun.updateSpeedrun(req, res))
    app.delete('/api/speedruns/:id', (req, res) => speedrun.deleteSpeedrun(req, res))

    // Runners
    app.get('/api/runners', (req, res) => runner.fetchRunner(req, res))
    app.get('/api/runners/:id', (req, res) => runner.fetchRunner(req, res))
    app.post('/api/runners', (req, res) => runner.updateRunner(req, res))
    app.post('/api/runners/:id', (req, res) => runner.updateRunner(req, res))
    app.delete('/api/runners/:id', (req, res) => runner.deleteRunner(req, res))

    // Incentives
    app.get('/api/incentives', (req, res) => incentive.fetchIncentive(req, res))
    app.post('/api/incentives', (req, res) => incentive.updateIncentive(req, res))
    app.post('/api/incentives/:id', (req, res) => incentive.updateIncentive(req, res))
    app.delete('/api/incentives/:id', (req, res) => incentive.deleteIncentive(req, res))

    // Users
    app.get('/api/users', (req, res) => user.fetchUser(req, res))
    app.get('/api/users/:id', (req, res) => user.fetchUser(req, res))
    app.post('/api/users', (req, res) => user.updateUser(req, res))
    app.post('/api/users/:id', (req, res) => user.updateUser(req, res))
    app.delete('/api/users/:id', (req, res) => user.deleteUser(req, res))

    // API functions.
    function login(req, res) {
        if (req.body.username === undefined || req.body.password === undefined) return res.status(401).send({ error: 'Username or password is incorrect.' })
        database.models['user'].findOne({ username: req.body.username }).exec((err, result) => {
            if (err) return res.status(401).send({ error: 'Username or password is incorrect.' })
            bcrypt.compare(req.body.password, result.get('password', null, { getters: false }), (error, match) => {
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
                    result.save();
                    return res.status(200).send({ username: result.username, id: result.id, token: token })
                }
                return res.status(401).send({ error: 'Username or password is incorrect.' })
            });
        })
    }

    async function sendDonationInfo(req, res) {
        let event = await database.models['event'].findOne({ visible: true, active: true }).populate('charity');
        if (event === null || event === undefined) return res.status(404).send({ error: 'No active event found.' });
        let incentive = await database.models['incentive'].find({ eventId: event.id, visible: true, active: true, completed: false }).populate('run');
        let value = {};
        value.eventId = event.id;
        value.eventShort = event.short;
        value.charityName = event.charity.name;
        value.currency = 'USD';
        value.minDonation = event.minDonation;
        value.incentives = [];
        for (const item of incentive) {
            let incentiveOptions = [];
            for (const option of item.options) {
                incentiveOptions.push({
                    id: option.id,
                    name: option.name,
                    total: option.total,
                })
            }
            value.incentives.push({
                id: item.id,
                name: item.name,
                description: item.description,
                type: item.type,
                options: incentiveOptions,
                goal: item.goal,
                total: item.total,
                allowUserOptions: item.allowUserOptions,
                userOptionMaxLength: item.userOptionMaxLength,
                run: {
                    id: item.run.id,
                    game: item.run.game,
                    category: item.run.category,
                },
            })
        }
        value.prizes = [];
        value.custom = [];
        res.status(200).send(value);
    }

    function logout(req, res) {
        tracker.loggedInUsers.splice(res.locals.session);
        res.status(200).send({})
    }
}