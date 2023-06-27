const { v4: uuid } = require('uuid');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const donation = require('../donation/donation.js');
const serverEvents = require('../serverEvents/serverEvents.js')

module.exports = (tracker, database) => {

    const app = tracker.server;
    app.use(cors())
    const unsecurePath = [
        '/donation/create',
        '/donation/ipn',
        '/login',
        '/speedruns/',
        '/speedruns/event/',
        '/incentives',
        '/incentives/event',
        '/donation/info',
        '/donations',
        '/donations/:id',
        '/donations/event/:event',
        '/donor',
        '/donor/:id',
        '/prizes/event',
        '/details',
        '/events/list',
        '/events/stats'
    ]

    const modelsToSort = ['run', 'incentive', 'donation', 'event'];
    const permissionArray = ['access', 'read', 'modify', 'full'];

    const unsecuredModels = ['event', 'run', 'incentive', 'prize', 'donation', 'runner', 'donation'];

    // Authentication middleware.
    const authMiddleware = async (req, res, next) => {
        res.locals = {};
        if (!req.headers.authorization && req.method === 'GET' && unsecuredModels.includes(req.params.model)) {
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
            const loginStatus = await tracker.checkLoginStatus(data.data.session)
            if (loginStatus) {
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
    const requestMiddleware = async (req, res, next) => {
        if (req.params.model && req.params.model === 'blurb') req.params.model = 'ad';
        if (req.query && req.query.event) {
            if (req.query.event === 'all') return res.status(404).send({ code: 404, error: 'Event not found.' })
            const event = await database.findOne('event', { short: req.query.event });
            if (!event) return res.status(404).send({ code: 404, error: 'Event not found.' });
            req.query.event = event._id;
        }
        else if (req.query && req.query.eventId) {
            if (req.query.eventId === 'all') return res.status(404).send({ code: 404, error: 'Event not found.' })
            const event = await database.findOne('event', { short: req.query.eventId });
            if (!event) return res.status(404).send({ code: 404, error: 'Event not found.' });
            req.query.eventId = event._id;
        }
        return next();
    }

    // Unsecured API routes.
    app.get('/ping', (req, res) => res.status(200).send({ status: 200, ping: 'pong' }))
    app.post('/donation/create', (req, res) => donation.createDonation(req, res))
    app.post('/donation/ipn', (req, res) => donation.verifyIPN(req, res))
    app.get('/login', (req, res) => login(req, res));
    app.get('/donation/info', requestMiddleware, (req, res) => sendDonationInfo(req, res))
    app.get('/details', (req, res) => sendMiscDetails(req, res))

    // Secured API endpoints.
    app.get('/verify', authMiddleware, (req, res) => verify(req, res));
    app.post('/updatePassword', authMiddleware, (req, res) => updatePassword(req, res))
    app.get('/logout', authMiddleware, (req, res) => logout(req, res));
    app.get('/run/current/event', (req, res) => serverEvents.currentRunEvent(req, res));

    // Data endpoints.
    app.get('/:model', authMiddleware, requestMiddleware, (req, res) => GET(req, res))
    app.post('/:model', authMiddleware, requestMiddleware, (req, res) => POST(req, res))
    app.delete('/:model', authMiddleware, requestMiddleware, (req, res) => DELETE(req, res))

    app.get('/:model/stats', authMiddleware, requestMiddleware, (req, res) => stats(req, res))
    app.get('/:model/paginate', authMiddleware, requestMiddleware, (req, res) => paginate(req, res))

    // GET Request
    async function GET(req, res) {
        let populate = req.query.populate;
        delete req.query.populate;
        for (const prop in req.query) {
            if (req.query[prop] === 'true') req.query[prop] = true;
            else if (req.query[prop] === 'false') req.query[prop] = false;
        }
        if (typeof populate === 'string') populate = populate.split(',');
        try {
            let data;
            if (Object.keys(req.query).length <= 0) data = await database.findAll(req.params.model, populate);
            else data = await database.find(req.params.model, req.query, populate);
            if (data.length > 1 && modelsToSort.includes(req.params.model)) data = await sortData(req.params.model, data);
            return res.status(200).send(data);
        } catch (err) {
            return res.status(500).send(err);
        }
    }

    // POST Request
    async function POST(req, res) {
        let status, data;
        if (Object.keys(req.query).length === 0) [status, data] = await database.create(req.params.model, req.body);
        else[status, data] = await database.update(req.params.model, req.query, req.body)
        if (status) {
            let errorList = [];
            if (data.errors) {
                for (const error in data.errors) {
                    if (data.errors[error].message.includes('Cast to')) data.errors[error].message = `${req.params.model.charAt(0).toUpperCase() + req.params.model.slice(1)} is invalid.`
                    errorList.push({ item: error, code: data.errors[error].message.charAt(0).toUpperCase() + data.errors[error].message.slice(1) })
                }
            }
            return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
        }
        else res.status(200).send(data);
    }

    // DELETE Request
    async function DELETE(req, res) {
        if (!req.query || !req.query._id) return res.status(400).send({ error: "One or multiple id's must be specified." })
        try {
            if (typeof req.query._id === 'string') await database.deleteOne(req.params.model, req.query._id);
            else await database.deleteMany(req.params.model, req.query._id);
            return res.status(200).send({});
        } catch (err) {
            return res.status(err.code).send(err);
        }
    }

    // Get stats.
    async function stats(req, res) {
        let populate = req.query.populate;
        delete req.query.populate;
        for (const prop in req.query) {
            if (req.query[prop] === 'true') req.query[prop] = true;
            else if (req.query[prop] === 'false') req.query[prop] = false;
        }
        if (typeof populate === 'string') populate = populate.split(',');
        try {
            let data = await database.find(req.params.model, req.query, populate);
            if (data.length > 1 && modelsToSort.includes(req.params.model)) data = await sortData(req.params.model, data);
            for (let i = 0; i < data.length; i++) {
                data[i].stats = await database.getStats(req.params.model, data[i]);
            }
            return res.status(200).send(data);
        } catch (err) {
            return res.status(err.code).send(err);
        }
    }

    // Pagination.
    async function paginate(req, res) {
        let populate = req.query.populate;
        let pagination = { limit: (req.query.limit) ? parseInt(req.query.limit) : 49, page: (req.query.page) ? parseInt(req.query.page - 1) : 0 };
        delete req.query.limit;
        delete req.query.page;
        delete req.query.populate;
        for (const prop in req.query) {
            if (req.query[prop] === 'true') req.query[prop] = true;
            else if (req.query[prop] === 'false') req.query[prop] = false;
        }
        if (typeof populate === 'string') populate = populate.split(',');
        try {
            let data = await database.find(req.params.model, req.query, populate);
            if (data.length > 1 && modelsToSort.includes(req.params.model)) data = await sortData(req.params.model, data);
            let totalPages = Math.floor(data.length / pagination.limit) + 1;
            if (pagination.page > totalPages) pagination.page = totalPages;
            let paginatedData = data.slice((pagination.limit * pagination.page), (pagination.limit * pagination.page) + pagination.limit);
            let response = {
                total: data.length,
                count: paginatedData.length,
                indexStart: pagination.limit * pagination.page,
                indexEnd: ((pagination.limit * pagination.page) + pagination.limit > data.length) ? data.length : (pagination.limit * pagination.page) + pagination.limit,
                page: pagination.page,
                totalPages: totalPages,
                data: paginatedData,
            }
            return res.status(200).send(response);
        } catch (err) {
            return res.status(500).send(err);
        }
    }

    // Sort data.
    async function sortData(model, data) {
        return new Promise(async (resolve, reject) => {
            let sortedData;
            switch (true) {
                case (model === 'run' || model === 'event' || model === 'incentive'): sortedData = await data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); break;
                case (model === 'donation'): sortedData = await data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); break;
            }
            resolve(sortedData)
        })
    }

    // API functions.
    async function login(req, res) {
        if (!req.query || !req.query.username || !req.query.password) return res.status(401).send({ error: 'Username or password is incorrect.' })
        const user = await database.findOne('user', { username: req.query.username });
        if (!user) return res.status(401).send({ error: 'Username or password is incorrect.' });
        bcrypt.compare(req.query.password, user.password, async (error, match) => {
            if (match) {
                let session = uuid();
                let token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 43200000,
                    data: {
                        username: user.username,
                        id: user._id,
                        session: session,
                    }
                }, tracker.config.tracker.passwordHash);
                await tracker.addUserSession(session, Math.floor(Date.now() / 1000) + 43200000);
                let userData = await database.models['user'].findOne({ _id: user._id });
                userData.lastLogin = Date.now();
                await userData.save();
                return res.status(200).send({ username: user.username, id: user._id, token: token, admin: user.admin, volunteer: user.volunteer })
            }
            else return res.status(401).send({ error: 'Username or password is incorrect.' });
        });
    }

    async function verify(req, res) {
        if (!req.query.model) return res.status(403).send({ error: 'User not authorized to view this resource.' });
        const user = await database.findOne('user', { _id: res.locals.id }, ['group']);
        if (req.query.model === 'null' || user.superuser) return res.status(200).send({ admin: user.admin, volunteer: user.volunteer });
        const permission = user.group.permissions.find(x => x.model === req.params.model);
        if (permission && permissionArray.indexOf(permission.level) >= permissionArray.indexOf(req.query.action)) return res.status(200).send({ admin: user.admin, volunteer: user.volunteer })
        return res.status(403).send({ error: 'User not authorized to view this resource.' });
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
        tracker.removeUserSession(res.locals.session);
        res.status(200).send({})
    }

    async function sendMiscDetails(req, res) {
        let details = {
            url: (tracker.config.ssl.enabled) ? `https://${tracker.config.baseURL}` : `http://${tracker.config.baseURL}`,
            name: tracker.config.tracker.name,
            homepage: tracker.config.tracker.homepage,
            currency: tracker.config.paypal.currency,
            currencySymbol: tracker.currencies[tracker.config.paypal.currency],
            eventList: [],
        }
        let activeEvent = await database.findOne('event', { active: true }, ['charity']);
        if (activeEvent) {
            details.activeEvent = activeEvent;
            // let currentRunDetails = await database.getCache('currentRun');
            // details.currentRun = {
            //     currentRun: currentRunDetails.currentRun,
            //     delay: currentRunDetails.delay,
            // }
        }
        let eventList = await database.findAll('event');
        if (eventList) {
            let sortedEvents = eventList.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            sortedEvents.forEach(event => {
                details.eventList.push({ short: event.short, name: event.name, id: event._id })
            })
        }
        if (tracker.config.googleAnalytics.enabled) details.analyticsMeasurmentId = tracker.config.googleAnalytics.measurmentId;
        return res.status(200).send(details);
    }

    async function updatePassword(req, res) {
        let user = await database.findOne('user', { _id: res.locals.id });
        bcrypt.compare(req.body.oldPassword, user.password, async (error, match) => {
            if (match && req.body.newPassword === req.body.confirmPassword) {
                let newPassword = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10));
                [save, data] = await database.update('user', { _id: res.locals.id }, {
                    password: newPassword,
                })
                if (save) {
                    let errorList = [];
                    if (data.errors) {
                        for (const error in data.errors) {
                            if (data.errors[error].message.includes('Cast to')) data.errors[error].message = `${req.params.model.charAt(0).toUpperCase() + req.params.model.slice(1)} is invalid.`
                            errorList.push({ item: error, code: data.errors[error].message.charAt(0).toUpperCase() + data.errors[error].message.slice(1) })
                        }
                    }
                    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
                }
                return res.status(200).send({});
            }
        });
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