const fetch = require('node-fetch');
const moment = require('moment');
let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchSpeedrun = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['run'].findOne({ _id: req.params.id }).populate('runners').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving speedrun data.' })
            return res.status(200).send(data)
        })
    }
    else if (req.params.event !== undefined) {
        database.models['run'].find({ eventId: req.params.event }).populate('runners').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving speedrun data.' })
            let sortedRuns = data.sort((a, b) => a.startTime - b.startTime)
            return res.status(200).send(sortedRuns)
        })
    }
    else {
        database.models['run'].find({}).populate('runners').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving speedrun data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteSpeedrun = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['run'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete speedrun.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateSpeedrun = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['run'].findOne({ _id: req.params.id }).exec((err, data) => {
            for (const [key, value] of Object.entries(req.body)) {
                data[key] = value;
            }
            data.save()
                .then(savedData => res.status(200).send(savedData))
                .catch(err => returnErrors(err, res))
            return;
        })
        return;
    }
    database.models['run'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        for (const runner of req.body.runners) {
            database.models['runner'].findOne({ _id: runner }).exec((runnerErr, runnerData) => {
                runnerData.runs.push(data.id);
                runnerData.save()
            })
        }
        return res.status(200).send(data);
    })
}

module.exports.importSpeedruns = async (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.event !== undefined) {
        let schedule;
        const submissions = await fetch(`https://oengus.io/api/marathons/${req.body.short}/submissions`).then(subRes => subRes.json());
        if (submissions.length <= 0) return res.status(404).send({ error: 'Marathon short is invalid.', errorCodes: [{ item: 'short', code: 'Marathon short is invalid.' }] });
        const selections = await fetch(`https://oengus.io/api/marathons/${req.body.short}/selections`).then(selRes => selRes.json());
        if (req.body.schedule) {
            schedule = await fetch(`https://oengus.io/api/marathons/${req.body.short}/schedule`).then(schData => schData.json());
            if (schedule.length <= 0) return res.status(409).send({ error: 'Marathon schedule is not published.', errorCodes: [{ item: 'schedule', code: 'Marathon schedule is not published.' }] });
        }
        for (const submission of submissions) {
            for (const game of submission.games) {
                for (const category of game.categories) {
                    if (selections[category.id] !== undefined && selections[category.id].status === 'VALIDATED') {
                        let runnerArray = [];
                        let runner = await database.models['runner'].findOne({ name: submission.user.username });
                        if (runner === null) runner = await createRunner(submission.user);
                        runnerArray.push(runner);
                        for (const gameRunner of category.opponentDtos) {
                            let opponentRunner = await database.models['runner'].findOne({ name: gameRunner.user.username });
                            if (opponentRunner === null) runnerArray.push(await createRunner(gameRunner.user));
                            else runnerArray.push(opponentRunner);
                        }
                        let speedrun = {
                            eventId: req.params.event,
                            game: game.name,
                            category: category.name,
                            runners: runnerArray.map(x => x._id),
                            multiplayer: (runnerArray.length > 1) ? true : false,
                            description: game.description,
                            startTime: Date.now(),
                            estimate: moment.utc(moment.duration(category.estimate).as('milliseconds')).format('HH:mm:ss'),
                            finalTime: '',
                            setupTime: '',
                            finalSetupTime: '',
                            region: '',
                            releaseYear: null,
                            console: game.console,
                            completed: false,
                            notes: '',
                        }
                        if (req.body.schedule) {
                            const scheduleData = schedule.lines.find(x => x.categoryId === category.id);
                            if (scheduleData !== undefined) {
                                speedrun.startTime = new Date(scheduleData.date);
                                speedrun.setupTime = moment.utc(moment.duration(scheduleData.setupTime).as('milliseconds')).format('HH:mm:ss');
                            }
                        }
                        let speedrunData = await database.models['run'].create(speedrun);
                        for (let gameRunner of runnerArray) {
                            gameRunner.runs.push(speedrunData._id);
                            gameRunner.save();
                        }
                    }
                }
            }
        }
        return res.status(200).send({})
    }
}

async function createRunner(runner) {
    let runnerProfile = {
        name: runner.username,
        email: '',
        pronouns: (runner.pronouns !== undefined && runner.pronouns.length > 0) ? runner.pronouns.join(', ') : '',
        runs: [],
    };
    if (runner.connections.length > 0) {
        for (const connection of runner.connections) {
            switch (connection.platform) {
                case 'TWITCH': runnerProfile.twitch = connection.username; break;
                case 'TWITTER': runnerProfile.twitter = connection.username; break;
                case 'DISCORD': runnerProfile.discord = connection.username; break;
                case 'SPEEDRUNCOM': runnerProfile.src = connection.username; break;
            }
        }
    }
    runner = await database.models['runner'].create(runnerProfile);
    return runner;
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            if (errors.errors[error].message.includes('Cast to [ObjectId] failed for value')) errors.errors[error].message = 'Runner is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}

module.exports.setStartTime = async (req, res) => {
    if (!req.body ||!req.params.id) return res.status(400).send({ error: 'Missing parameters.' })
    let run = await database.models['run'].findOne({ _id: req.params.id });
    if (run === undefined || run === null) return res.status(500).send({ error: 'Error retriving speedrun data.' })
    let body = JSON.parse(req.body);
    run.actualStartTime = new Date(body.startTime);
    run.save();
    return res.status(200).send({});
}

module.exports.setFinalTime = async (req, res) => {
    if (!req.body ||!req.params.id) return res.status(400).send({ error: 'Missing parameters.' })
    let run = await database.models['run'].findOne({ _id: req.params.id });
    if (run === undefined || run === null) return res.status(500).send({ error: 'Error retriving speedrun data.' })
    let body = JSON.parse(req.body);
    run.finalTime = body.finalTime;
    run.save();
    return res.status(200).send({});
}