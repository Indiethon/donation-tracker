const { v4: uuid } = require('uuid');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const WebSocket = require('ws');
const blurb = require('./blurb');
const auditLog = require('./auditLog')
const charity = require('./charity');
const donation = require('./donation');
const donor = require('./donor');
const emailAddress = require('./emailAddress');
const emailTemplate = require('./emailTemplate');
const event = require('./event');
const group = require('./group');
const incentive = require('./incentive');
const speedrun = require('./speedrun');
const prize = require('./prize');
const prizeRedemption = require('./prizeRedemption');
const runner = require('./runner');
const user = require('./user');
const wordFilter = require('./wordFilter');
const emails = require('../email/email');

module.exports = (tracker, database) => {

    const app = tracker.server;
    const unsecurePath = [
        '/api/donation/create',
        '/api/donation/ipn',
        '/api/login',
        '/api/speedruns/',
        '/api/speedruns/event/',
        '/api/incentives',
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
        '/api/events/stats'
    ]

    let serverUpgrade = false;

    // Start modules.
    blurb.load(tracker, database);
    auditLog.load(tracker, database);
    charity.load(tracker, database);
    donation.load(tracker, database);
    donor.load(tracker, database);
    emailAddress.load(tracker, database);
    emailTemplate.load(tracker, database);
    event.load(tracker, database);
    group.load(tracker, database);
    incentive.load(tracker, database);
    prize.load(tracker, database);
    prizeRedemption.load(tracker, database)
    runner.load(tracker, database);
    speedrun.load(tracker, database);
    user.load(tracker, database);
    wordFilter.load(tracker, database);

    // Authentication middleware.
    const authMiddleware = async (req, res, next) => {
        res.locals = {};
        if (!req.headers.authorization && req.method === 'GET' && req.path.includes('/api/prizes')) {
            res.locals.secure = false;
            return next();
        }
        if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
        if (tracker.config.tracker.tokens.includes(req.headers.authorization.split(' ')[1])) {
            res.locals.secure = true;
            return next();
        }
        jwt.verify(req.headers.authorization.split(' ')[1], tracker.config.tracker.passwordHash, async (error, data) => {
            if (error) { res.status(401).send({ error: 'Invalid token.' }); return; }
            if (tracker.loggedInUsers.includes(data.data.session)) {
                res.locals.username = data.data.username;
                res.locals.id = data.data.id;
                res.locals.session = data.data.session;
                res.locals.secure = true;
                next();

                res.on("finish", async (data) => {
                    if (!data) return;
                    data.timestamp = Date.now();
                    let savedData = await database.models['auditLog'].create(data);
                    savedData.save();
                    if (!savedData) console.error('Error updating audit log.\n', savedData)
                });

                return;
            }
            else res.status(401).send({ error: 'Invalid session.' })
        });
    };

    // Event short middleware
    const eventMiddleware = async (req, res, next) => {
        // if (mongoose.Types.ObjectId.isValid(req.query.event)) return next();
        // if (req.query.event === undefined || req.query.event.length > 10) return next();
        // const event = await database.models['event'].findOne({ short: req.query.event });
        // if (!event) return res.status(200).send({ error: 'Could not find event' });
        // res.locals.event = event._id.toString();
        // next();

        if (mongoose.Types.ObjectId.isValid(req.params.event)) {
            res.locals.event = req.params.event;
            next();
            return;
        }
        if (req.params.event === 'all') return res.status(404).send({ error: 'Not found.' })
        if (req.params.event === undefined || req.params.event.length > 10) return next();
        const event = await database.models['event'].findOne({ short: req.params.event });
        if (!event) return res.status(200).send({ error: 'Could not find event' });
        res.locals.event = event._id;
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
    app.get('/api/incentives', (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/incentives/:id', (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/incentives/event/:event', eventMiddleware, (req, res) => incentive.fetchIncentive(req, res))
    app.get('/api/donation/info', eventMiddleware, (req, res) => sendDonationInfo(req, res))
    app.get('/api/donations', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/:id', (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donations/event/:event', eventMiddleware, (req, res) => donation.fetchDonation(req, res))
    app.get('/api/donors', (req, res) => donor.fetchDonor(req, res))
    app.get('/api/donors/:id', (req, res) => donor.fetchDonor(req, res))
    //app.get('/api/prizes', eventMiddleware, authMiddleware, (req, res) => prize.fetchPrize(req, res));
    app.get('/api/prizes/:id', authMiddleware, (req, res) => prize.fetchPrize(req, res))
    app.get('/api/prizes/event/:event', eventMiddleware, (req, res) => prize.fetchPrize(req, res))
    app.get('/api/events/stats/:event', eventMiddleware, (req, res) => event.getStats(req, res))
    app.get('/api/details', (req, res) => sendMiscDetails(req, res))
    app.get('/api/details/:short', (req, res) => sendMiscDetails(req, res))
    app.get('/api/runners', (req, res) => runner.fetchRunner(req, res))
    app.get('/api/runners/:id', (req, res) => runner.fetchRunner(req, res))
    app.get('/api/prizes', (req, res) => prize.fetchPrize(req, res))

    // Secured API endpoints.
    app.post('/api/verify', authMiddleware, (req, res) => verify(req, res));
    app.get('/api/logout', authMiddleware, (req, res) => logout(req, res));

    // Events
    app.get('/api/events', authMiddleware, (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/active', authMiddleware, (req, res) => event.fetchEvent(req, res))
    app.get('/api/events/:event', authMiddleware, eventMiddleware, (req, res) => event.fetchEvent(req, res))
    app.post('/api/events/:id', authMiddleware, (req, res) => event.updateEvent(req, res))
    app.delete('/api/events/:id', authMiddleware, (req, res) => event.deleteEvent(req, res))

    // Charities
    app.get('/api/charities', authMiddleware, (req, res) => charity.fetchCharity(req, res))
    app.get('/api/charities/:id', authMiddleware, (req, res) => charity.fetchCharity(req, res))
    app.post('/api/charities/:id', authMiddleware, (req, res) => charity.updateCharity(req, res))
    app.delete('/api/charities/:id', authMiddleware, (req, res) => charity.deleteCharity(req, res))

    // Speedruns
    app.post('/api/speedruns/:id', authMiddleware, (req, res) => speedrun.updateSpeedrun(req, res))
    app.post('/api/speedruns/startTime/:id', authMiddleware, (req, res) => speedrun.setStartTime(req, res));
    app.post('/api/speedruns/finalTime/:id', authMiddleware, (req, res) => speedrun.setFinalTime(req, res));
    app.post('/api/speedruns/import/:event', authMiddleware, (req, res) => speedrun.importSpeedruns(req, res))
    app.delete('/api/speedruns/:id', authMiddleware, (req, res) => speedrun.deleteSpeedrun(req, res))

    // Runners
    app.post('/api/runners', authMiddleware, (req, res) => runner.updateRunner(req, res))
    app.post('/api/runners/:id', authMiddleware, (req, res) => runner.updateRunner(req, res))
    app.delete('/api/runners/:id', authMiddleware, (req, res) => runner.deleteRunner(req, res))

    // Donations
    app.post('/api/donations/:id', authMiddleware, (req, res) => donation.updateDonation(req, res))
    app.delete('/api/donations/:id', authMiddleware, (req, res) => donation.deleteDonation(req, res))

    // Donors
    app.post('/api/donors/:id', authMiddleware, (req, res) => donor.updateDonor(req, res))
    app.delete('/api/donors/:id', authMiddleware, (req, res) => donor.deleteDonor(req, res))

    // Incentives
    app.post('/api/incentives/:id', authMiddleware, (req, res) => incentive.updateIncentive(req, res))
    app.delete('/api/incentives/:id', authMiddleware, (req, res) => incentive.deleteIncentive(req, res))

    // Prizes
    app.post('/api/drawPrizes', authMiddleware, (req, res) => prize.drawPrizes(req, res))
    app.get('/api/resetPrizes/:event', authMiddleware, (req, res) => prize.resetDrawnPrizes(req, res))
    app.post('/api/prizes', authMiddleware, (req, res) => prize.updatePrize(req, res))
    app.post('/api/prizes/:id', authMiddleware, (req, res) => prize.updatePrize(req, res))
    app.delete('/api/prizes/:id', authMiddleware, (req, res) => prize.deletePrize(req, res))

    // Prizes Redemptions
    app.get('/api/prizeRedemptions', authMiddleware, (req, res) => prizeRedemption.fetchPrizeRedemption(req, res))
    app.get('/api/prizeRedemptions/:id', authMiddleware, (req, res) => prizeRedemption.fetchPrizeRedemption(req, res))
    app.get('/api/prizeRedemptions/event/:event', authMiddleware, (req, res) => prizeRedemption.fetchPrizeRedemption(req, res))
    app.post('/api/prizeRedemptions', authMiddleware, (req, res) => prizeRedemption.updatePrizeRedemption(req, res))
    app.post('/api/prizeRedemptions/:id', authMiddleware, (req, res) => prizeRedemption.updatePrizeRedemption(req, res))
    app.delete('/api/prizeRedemptions/:id', authMiddleware, (req, res) => prizeRedemption.deletePrizeRedemption(req, res))

    // Users
    app.get('/api/users', authMiddleware, (req, res) => user.fetchUser(req, res))
    app.get('/api/users/:id', authMiddleware, (req, res) => user.fetchUser(req, res))
    app.post('/api/users', authMiddleware, (req, res) => user.updateUser(req, res))
    app.post('/api/users/:id', authMiddleware, (req, res) => user.updateUser(req, res))
    app.post('/api/updateUserPassword', authMiddleware, (req, res) => user.updatePassword(req, res))
    app.delete('/api/users/:id', authMiddleware, (req, res) => user.deleteUser(req, res))

    // Blurbs
    app.get('/api/blurbs', authMiddleware, (req, res) => blurb.fetchBlurb(req, res))
    app.get('/api/blurbs/:id', authMiddleware, (req, res) => blurb.fetchBlurb(req, res))
    app.get('/api/blurbs/event/:event', authMiddleware, eventMiddleware, (req, res) => blurb.fetchBlurb(req, res))
    app.post('/api/blurbs', authMiddleware, (req, res) => blurb.updateBlurb(req, res))
    app.post('/api/blurbs/:id', authMiddleware, (req, res) => blurb.updateBlurb(req, res))
    app.delete('/api/blurbs/:id', authMiddleware, (req, res) => blurb.deleteBlurb(req, res))

    // Groups
    app.get('/api/groups', authMiddleware, (req, res) => group.fetchGroup(req, res))
    app.get('/api/groups/:id', authMiddleware, (req, res) => group.fetchGroup(req, res))
    app.post('/api/groups', authMiddleware, (req, res) => group.updateGroup(req, res))
    app.post('/api/groups/:id', authMiddleware, (req, res) => group.updateGroup(req, res))
    app.delete('/api/groups/:id', authMiddleware, (req, res) => group.deleteGroup(req, res))

    // Word Filters
    app.get('/api/wordFilters', authMiddleware, (req, res) => wordFilter.fetchWordFilter(req, res))
    app.get('/api/wordFilters/:id', authMiddleware, (req, res) => wordFilter.fetchWordFilter(req, res))
    app.post('/api/wordFilters', authMiddleware, (req, res) => wordFilter.updateWordFilter(req, res))
    app.post('/api/wordFilters/:id', authMiddleware, (req, res) => wordFilter.updateWordFilter(req, res))
    app.delete('/api/wordFilters/:id', authMiddleware, (req, res) => wordFilter.deleteWordFilter(req, res))

    // Audit Log
    app.get('/api/auditLogs', authMiddleware, (req, res) => auditLog.fetchAuditLog(req, res))
    app.delete('/api/auditLogs', authMiddleware, (req, res) => auditLog.deleteAuditLog(req, res))

    // Email Addresses
    app.get('/api/emailAddress', authMiddleware, (req, res) => emailAddress.fetchEmailAddress(req, res))
    app.get('/api/emailAddress/:id', authMiddleware, (req, res) => emailAddress.fetchEmailAddress(req, res))
    app.post('/api/emailAddress', authMiddleware, (req, res) => emailAddress.updateEmailAddress(req, res))
    app.post('/api/emailAddress/:id', authMiddleware, (req, res) => emailAddress.updateEmailAddress(req, res))
    app.delete('/api/emailAddress/:id', authMiddleware, (req, res) => emailAddress.deleteEmailAddress(req, res))

    // Email Templates
    app.get('/api/emailTemplate', authMiddleware, (req, res) => emailTemplate.fetchEmailTemplate(req, res))
    app.get('/api/emailTemplate/:id', authMiddleware, (req, res) => emailTemplate.fetchEmailTemplate(req, res))
    app.post('/api/emailTemplate', authMiddleware, (req, res) => emailTemplate.updateEmailTemplate(req, res))
    app.post('/api/emailTemplate/:id', authMiddleware, (req, res) => emailTemplate.updateEmailTemplate(req, res))
    app.delete('/api/emailTemplate/:id', authMiddleware, (req, res) => emailTemplate.deleteEmailTemplate(req, res))

    // Emails
    app.post('/api/sendTestEmails', authMiddleware, (req, res) => emails.sendTestEmails(req, res))
    app.post('/api/sendPrizeEmails', authMiddleware, (req, res) => emails.sendPrizeEmails(req, res))


    // Donation websocket.
    let wsServer = new WebSocket.WebSocketServer({ noServer: true, });
    app.get('/api/websocket/start', (req, res) => {
        if (!serverUpgrade) upgradeServer(req.connection.server);
        res.status(200).send({});
    });

    function upgradeServer(server) {
        serverUpgrade = true;
        server.on('upgrade', (req, socket, head) => {
            if (req.url.includes('/api/websocket/data')) {
                wsServer.handleUpgrade(req, socket, head, (wsConnection) => {
                    wsServer.emit('connection', wsConnection, req);
                    wsServer.ws = wsConnection;
                });
            }
        })
    }

    wsServer.on('connection', (ws, req) => {
        if (req.url === '/api/websocket/data') donation.addClient(ws);
    })

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
            else return res.status(401).send({ error: 'Username or password is incorrect.' });
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
        const incentives = await database.models['incentive'].find({ eventId: tracker.cache.get('activeEvent')._id, visible: true, active: true, completed: false }).sort('endTime').populate('run');
        const prizes = await database.models['prize'].find({ eventId: tracker.cache.get('activeEvent')._id, visible: true, active: true, drawn: false }).sort('endTime');
        let value = {
            event: tracker.cache.get('activeEvent'),
            incentives: [],
            prizes: [],
            custom: [],
        };

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
            url: (tracker.config.ssl.enabled) ? `https://${tracker.config.baseURL}` : `http://${tracker.config.baseURL}`,
            name: tracker.config.tracker.name,
            description: tracker.config.frontend.description,
            homepage: tracker.config.tracker.homepage,
            privacyPolicy: tracker.config.legal.privacyPolicy,
            sweepstakesRules: tracker.config.legal.sweepstakesRules,
            currency: tracker.config.paypal.currency,
            currencySymbol: currencies[tracker.config.paypal.currency],
            donationSuccessMessage: tracker.config.frontend.donationSuccessMessage,
            donationErrorMessage: tracker.config.frontend.donationErrorMessage,
            prizeClaimMessage: tracker.config.prizes.prizeClaimMessage,
            prizeForfeitMessage: tracker.config.prizes.prizeForfeitMessage,
            prizeErrorMessage: tracker.config.prizes.prizeErrorMessage,
            eventList: {},
        }
        if (req.params.short) {
            let event = await database.models['event'].findOne({ short: req.params.short }).populate('charity');
            if (event) details.event = event;
        }
        let activeEvent = await database.models['event'].findOne({ active: true }).populate('charity');
        if (activeEvent) {
            details.activeEvent = activeEvent;
            if (!details.event) details.event = activeEvent;
        }
        let eventList = await database.models['event'].find();
        if (eventList) {
            let sortedEvents = eventList.sort((a, b) => b.startTime - a.startTime);
            for (const event of sortedEvents) {
                details.eventList[event.short] = event.name;
            }
        }
        if (tracker.config.googleAnalytics.enabled) details.analyticsMeasurmentId = tracker.config.googleAnalytics.measurmentId;
        res.status(200).send(details);
    }
}

async function addToAuditLog(user, resource, model, action) {
    let auditLogData = {
        timestamp: Date.now(),
        userId: user,
        resourceId: resource,
        model: model,
        action: action
    }
    let savedData = await database.models['auditLog'].create(auditLogData);
    if (!savedData) console.error('Error updating audit log.\n', savedData)
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
