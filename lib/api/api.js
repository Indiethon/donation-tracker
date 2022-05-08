const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ad = require('./ad');
const charity = require('./charity');
const donation = require('./donation');
const donor = require('./donor');
const event = require('./event');
const incentive = require('./incentive');
const speedrun = require('./speedrun');
const prize = require('./prize');
const runner = require('./runner');
const user = require('./user');
const wordFilter = require('./wordFilter');

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = [
        '/api/donation/create',
        '/api/donation/ipn',
        '/api/login',
        '/api/speedruns/:id',
        '/api/speedruns/event/:event',
        '/api/incentives/:id',
        '/api/incentives/event/:id',
        '/api/donation/info',
        '/api/donations',
        '/api/donations/:id',
        '/api/donations/event/:event',
        '/api/donor',
        '/api/donor/:id',
        '/api/prizes/:id',
        '/api/prizes/event/:event',
    ]

    // Start modules.
    ad.load(tracker, database);
    charity.load(tracker, database);
    donation.load(tracker, database);
    donor.load(tracker, database);
    event.load(tracker, database);
    incentive.load(tracker, database);
    prize.load(tracker, database);
    runner.load(tracker, database);
    speedrun.load(tracker, database);
    user.load(tracker, database);
    wordFilter.load(tracker, database);

    // Authentication middleware.
    app.use((req, res, next) => {
        if (unsecurePath.includes(req.path) || !req.path.includes('/api/')) return next();
        if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
        if (tracker.config.tracker.tokens.includes(req.headers.authorization.split(' ')[1])) return next();
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
    app.get('/api/donations', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/:id', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/event/:event', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donors', (req, res) => donor.fetchDonor(req, res))
    app.get('/api/donors/:id', (req, res) => donor.fetchDonor(req, res))
    app.get('/api/prizes/:id', (req, res) => prize.fetchPrize(req, res))
    app.get('/api/prizes/event/:event', (req, res) => prize.fetchPrize(req, res))

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
    app.post('/api/speedruns/import/:event', (req, res) => speedrun.importSpeedruns(req, res))
    app.delete('/api/speedruns/:id', (req, res) => speedrun.deleteSpeedrun(req, res))

    // Runners
    app.get('/api/runners', (req, res) => runner.fetchRunner(req, res))
    app.get('/api/runners/:id', (req, res) => runner.fetchRunner(req, res))
    app.post('/api/runners', (req, res) => runner.updateRunner(req, res))
    app.post('/api/runners/:id', (req, res) => runner.updateRunner(req, res))
    app.delete('/api/runners/:id', (req, res) => runner.deleteRunner(req, res))

    // Donations
    app.post('/api/donations', (req, res) => donation.updateDonation(req, res))
    app.post('/api/donations/:id', (req, res) => donation.updateDonation(req, res))
    app.delete('/api/donations/:id', (req, res) => donation.deleteDonation(req, res))

    // Donors
    app.post('/api/donors', (req, res) => donor.updateDonor(req, res))
    app.post('/api/donors/:id', (req, res) => donor.updateDonor(req, res))
    app.delete('/api/donors/:id', (req, res) => donor.deleteDonor(req, res))

    // Incentives
    app.get('/api/incentives', (req, res) => incentive.fetchIncentive(req, res))
    app.post('/api/incentives', (req, res) => incentive.updateIncentive(req, res))
    app.post('/api/incentives/:id', (req, res) => incentive.updateIncentive(req, res))
    app.delete('/api/incentives/:id', (req, res) => incentive.deleteIncentive(req, res))

    // Prizes
    app.get('/api/prizes', (req, res) => prize.fetchPrize(req, res))
    app.post('/api/prizes', (req, res) => prize.updatePrize(req, res))
    app.post('/api/prizes/:id', (req, res) => prize.updatePrize(req, res))
    app.delete('/api/prizes/:id', (req, res) => prize.deletePrize(req, res))

    // Users
    app.get('/api/users', (req, res) => user.fetchUser(req, res))
    app.get('/api/users/:id', (req, res) => user.fetchUser(req, res))
    app.post('/api/users', (req, res) => user.updateUser(req, res))
    app.post('/api/users/:id', (req, res) => user.updateUser(req, res))
    app.post('/api/updateUserPassword', (req, res) => user.updatePassword(req, res))
    app.delete('/api/users/:id', (req, res) => user.deleteUser(req, res))

    // Ads
    app.get('/api/ads', (req, res) => ad.fetchAd(req, res))
    app.get('/api/ads/:id', (req, res) => ad.fetchAd(req, res))
    app.get('/api/ads/event/:event', (req, res) => ad.fetchAd(req, res))
    app.post('/api/ads', (req, res) => ad.updateAd(req, res))
    app.post('/api/ads/:id', (req, res) => ad.updateAd(req, res))
    app.delete('/api/ads/:id', (req, res) => ad.deleteAd(req, res))

    // Word Filters
    app.get('/api/wordFilters', (req, res) => wordFilter.fetchWordFilter(req, res))
    app.get('/api/wordFilters/:id', (req, res) => wordFilter.fetchWordFilter(req, res))
    app.post('/api/wordFilters', (req, res) => wordFilter.updateWordFilter(req, res))
    app.post('/api/wordFilters/:id', (req, res) => wordFilter.updateWordFilter(req, res))
    app.delete('/api/wordFilters/:id', (req, res) => wordFilter.deleteWordFilter(req, res))

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
                    return res.status(200).send({ username: result.username, id: result.id, token: token, superuser: result.superuser, volunteer: result.volunteer })
                }
                return res.status(401).send({ error: 'Username or password is incorrect.' })
            });
        })
    }

    async function sendDonationInfo(req, res) {
        let event = await database.models['event'].findOne({ visible: true, active: true }).populate('charity');
        if (event === null || event === undefined) return res.status(404).send({ error: 'No active event found.' });
        const incentives = await database.models['incentive'].find({ eventId: event.id, visible: true, active: true, completed: false }).populate('run');
        const prizes = await database.models['prize'].find({ eventId: event.id, visible: true, active: true, drawn: false });
        let value = {};
        value.eventId = event.id;
        value.eventShort = event.short;
        value.charityName = event.charity.name;
        value.currency = 'USD';
        value.minDonation = event.minDonation;
        value.incentives = [];

        // Incentives
        for (let incentive of incentives) {
            let incentiveValue = {
                id: incentive.id,
                name: incentive.name,
                description: incentive.description,
                type: incentive.type,
                run: {
                    id: incentive.run.id,
                    game: incentive.run.game,
                    category: incentive.run.category,
                },
            }
            if (incentive.type === 'target') {
                await incentive.getStats((cb) => {
                    incentive = incentive.toObject({ virtuals: true });
                    incentiveValue.goal = incentive.goal;
                    incentiveValue.total = cb;
                });
                value.incentives.push(incentiveValue);
            }
            else if (incentive.type === 'bidwar') {
                incentiveValue.options = [];
                incentiveValue.allowUserOptions = incentive.allowUserOptions;
                if (incentive.allowUserOptions) incentiveValue.userOptionMaxLength = incentive.userOptionMaxLength;
                for (let option of incentive.options) {
                    await option.getStats((cb) => {
                        option = option.toObject({ virtuals: true });
                        option.total = cb;
                        incentiveValue.options.push(option)
                    });
                }
                value.incentives.push(incentiveValue);
            }
        }
       
        // Prizes
        value.prizes = [];
        for (const prize of prizes) {
            let prizeData = {
                name: prize.name,
                description: prize.description,
                type: prize.type,
                minDonation: prize.minDonation,
                value: prize.value,
                donator: prize.donator,
                image: prize.image,
                altImage: prize.altImage,
            }
            value.prizes.push(prizeData)
        }
        value.custom = event.customFields;
        res.status(200).send(value);
    }

    function logout(req, res) {
        tracker.loggedInUsers.splice(res.locals.session);
        res.status(200).send({})
    }
}