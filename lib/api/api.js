const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const ad = require('./ad');
const auditLog = require('./auditLog')
const charity = require('./charity');
const donation = require('./donation');
const donor = require('./donor');
const event = require('./event');
const group = require('./group');
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
        '/api/speedruns/event/',
        '/api/incentives/:id',
        '/api/incentives/event',
        '/api/donation/info',
        '/api/donations',
        '/api/donations/:id',
        '/api/donations/event/:event',
        '/api/donor',
        '/api/donor/:id',
        '/api/prizes/event',
        '/api/details',
        '/api/events/list',
        '/api/eventSource',
        '/api/events/stats',
    ]

    // Start modules.
    ad.load(tracker, database);
    auditLog.load(tracker, database);
    charity.load(tracker, database);
    donation.load(tracker, database);
    donor.load(tracker, database);
    event.load(tracker, database);
    group.load(tracker, database);
    incentive.load(tracker, database);
    prize.load(tracker, database);
    runner.load(tracker, database);
    speedrun.load(tracker, database);
    user.load(tracker, database);
    wordFilter.load(tracker, database);

    // Authentication middleware.
    app.use(async (req, res, next) => {
        const isUnsecure = unsecurePath.some(x => {
            if (req.path.includes(x)) return true
            return false;
        });
        if (isUnsecure || !req.path.includes('/api/')) return next();
        if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
        if (tracker.config.tracker.tokens.includes(req.headers.authorization.split(' ')[1])) return next();
        jwt.verify(req.headers.authorization.split(' ')[1], tracker.config.tracker.passwordHash, async (error, data) => {
            if (error) { res.status(401).send({ error: 'Invalid token.' }); return; }
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

    // Event short middleware
    const eventMiddleware = async (req, res, next) => {
        if (req.params.event === undefined || req.params.event.length > 10) return next();
        const event = await database.models['event'].findOne({ short: req.params.event });
        req.params.event = event._id;
        next();
    };

    // Unsecured API routes.
    app.post('/api/donation/create', (req, res) => donation.createDonation(req, res))
    app.post('/api/donation/ipn', (req, res) => donation.verifyIPN(req, res))
    app.post('/api/login', (req, res) => login(req, res));
    app.get('/api/events/list', (req, res) => event.generateEventList(req, res))
    app.get('/api/speedruns', (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/speedruns/:id', (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/speedruns/event/:event', eventMiddleware, (req, res) => speedrun.fetchSpeedrun(req, res))
    app.get('/api/incentives/:id', (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/incentives/event/:event', eventMiddleware, (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/donation/info', (req, res) => sendDonationInfo(req, res))
    app.get('/api/donations', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/:id', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/event/:event', eventMiddleware, (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donors', (req, res) => donor.fetchDonor(req, res))
    app.get('/api/donors/:id', (req, res) => donor.fetchDonor(req, res))
    app.get('/api/prizes/:id', (req, res) => prize.fetchPrize(req, res))
    app.get('/api/prizes/event/:event', eventMiddleware, (req, res) => prize.fetchPrize(req, res))
    app.get('/api/events/stats/:event', eventMiddleware, (req, res) => event.getStats(req, res))
    app.get('/api/details', (req, res) => sendMiscDetails(req, res))
    app.get('/api/details/:short', (req, res) => sendMiscDetails(req, res))

    // Secured API endpoints.
    app.get('/api/eventSource', (req, res) => donation.donationEventSource(req, res));
    app.post('/api/verify', (req, res) => verify(req, res));
    app.get('/api/logout', (req, res) => logout(req, res));

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
    app.get('/api/ads/event/:event', eventMiddleware, (req, res) => ad.fetchAd(req, res))
    app.post('/api/ads', (req, res) => ad.updateAd(req, res))
    app.post('/api/ads/:id', (req, res) => ad.updateAd(req, res))
    app.delete('/api/ads/:id', (req, res) => ad.deleteAd(req, res))

    // Groups
    app.get('/api/groups', (req, res) => group.fetchGroup(req, res))
    app.get('/api/groups/:id', (req, res) => group.fetchGroup(req, res))
    app.post('/api/groups', (req, res) => group.updateGroup(req, res))
    app.post('/api/groups/:id', (req, res) => group.updateGroup(req, res))
    app.delete('/api/groups/:id', (req, res) => group.deleteGroup(req, res))

    // Word Filters
    app.get('/api/wordFilters', (req, res) => wordFilter.fetchWordFilter(req, res))
    app.get('/api/wordFilters/:id', (req, res) => wordFilter.fetchWordFilter(req, res))
    app.post('/api/wordFilters', (req, res) => wordFilter.updateWordFilter(req, res))
    app.post('/api/wordFilters/:id', (req, res) => wordFilter.updateWordFilter(req, res))
    app.delete('/api/wordFilters/:id', (req, res) => wordFilter.deleteWordFilter(req, res))

    // Audit Log
    app.get('/api/auditLogs', (req, res) => auditLog.fetchAuditLog(req, res))
    app.delete('/api/auditLogs', (req, res) => auditLog.deleteAuditLog(req, res))

    // API functions.
    async function login(req, res) {
        if (req.body.username === undefined || req.body.password === undefined) return res.status(401).send({ error: 'Username or password is incorrect.' })
        let user = await database.models['user'].findOne({ username: req.body.username });
        if (user === null) return res.status(401).send({ error: 'Username or password is incorrect.' });
        bcrypt.compare(req.body.password, user.get('password', null, { getters: false }), (error, match) => {
            if (match) {
                let session = uuid();
                let token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 86400000,
                    data: {
                        username: user.username,
                        id: user.id,
                        session: session,
                    }
                }, tracker.config.tracker.passwordHash);
                tracker.loggedInUsers.push(session);
                user.lastLogin = Date.now();
                user.save();
                return res.status(200).send({ username: user.username, id: user.id, token: token, admin: user.admin, volunteer: user.volunteer })
            }
        });
    }

    async function verify(req, res) {
        if (req.body === undefined || req.body.model === undefined) return res.status(403).send({ error: 'User not authorized to view this resource.' });
        let permissionArray = ['access', 'read', 'modify', 'full'];
        let user = await database.models['user'].findOne({ _id: res.locals.id }).populate('group');
        if (req.body.model === null || user.superuser) return res.status(200).send({ admin: user.admin, volunteer: user.volunteer });
        let permission = user.group.permissions.find(x => x.model === req.body.model);
        if (permission !== undefined && permissionArray.indexOf(permission.level) >= permissionArray.indexOf(req.body.level)) return res.status(200).send({ admin: user.admin, volunteer: user.volunteer })
        else return res.status(403).send({ error: 'User not authorized to view this resource.' });
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
        value.currency = tracker.config.paypal.currency,
            value.currencySymbol = currencies[value.currency]
        value.minDonation = event.minDonation;
        value.incentives = [];
        value.privacyPolicy = tracker.config.legal.privacyPolicy;
        value.sweepstakesRules = tracker.config.legal.sweepstakesRules;

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

    async function sendMiscDetails(req, res) {
        let details = {
            name: tracker.config.tracker.name,
            homepage: tracker.config.tracker.homepage,
            privacyPolicy: tracker.config.legal.privacyPolicy,
            sweepstakesRules: tracker.config.legal.sweepstakesRules,
            currency: tracker.config.paypal.currency,
            currencySymbol: currencies[tracker.config.paypal.currency],
            donationSuccessMessage: tracker.config.frontend.donationSuccessMessage,
        }
        if (req.params.short !== undefined) {
            let event = await database.models['event'].findOne({ short: req.params.short })
            if (event !== null && event !== undefined) {
                details.eventID = event._id;
                details.eventName = event.name;
            }
        }
        else {
            let event = await database.models['event'].findOne({ active: true })
            if (event !== null && event !== undefined) {
                details.eventID = event._id;
                details.eventName = event.name;
                details.eventShort = event.short;
            }
        }
        res.status(200).send(details);
    }
}

const currencies = {
    'AUD': 'A$',
    'BRL': 'R$',
    'CAD': 'CA$',
    'CNY': 'CNY',
    'CZK': 'Kč',
    'DKK': 'kr',
    'EUR': '€',
    'HKD': 'HK$',
    'HUF': 'Ft',
    'ILS': '₪',
    'JPY': '¥',
    'MYR': 'RM',
    'MXN': 'MX$',
    'TWD': 'NT$',
    'NZD': 'NZ$',
    'NOK': 'kr',
    'PHP': '₱',
    'PLN': 'zł',
    'GBP': '£',
    'RUB': '₽',
    'SGD': 'S$',
    'SEK': 'kr',
    'CHF': 'CHF',
    'THB': '฿',
    'USD': '$',
}