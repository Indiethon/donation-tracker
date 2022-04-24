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
            let sortedRuns = data.sort((a, b) => b.startTime - a.startTime)
            return res.status(200).send(sortedRuns)
        })
    }
    else {
        database.models['run'].find({}).populate('runners').exec((err, data) => {
            console.log(err)
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

// module.exports.fetchSpeedrun = (req, res) => {
//     if (req.params.id !== undefined) {
//         database.find('run', { _id: req.params.id }, (err, data) => {

//             if (!err && data !== undefined) return res.status(200).send(data);
//         })
//     }
//     else if (req.params.event !== undefined) {
//         database.findAll('run', { event: req.params.event }, (err, data) => {
//             if (err) return res.status(500).send({ error: 'Could not fetch runs.' })
//             if (data === undefined) return res.status(200).send([]);
//             let sortedRuns = data.sort((a, b) => b.startTime - a.startTime)
//             res.status(200).send(sortedRuns)
//         })
//         return;
//     }
//     else {
//         let runList = [];
//         database.findAll('run', {}, (err, data) => {
//             if (err) return res.status(500).send({ error: 'Could not fetch runs.' })
//             if (data === undefined) return res.status(200).send([]);
//             let sortedRuns = data.sort((a, b) => b.startTime - a.startTime)
//             for (let run of sortedRuns) {
//                 runList.push(run)
//             }
//             res.status(200).send(runList)
//         })
//         return;
//     }
// }

// module.exports.deleteSpeedrun = (req, res) => {
//     if (req.params.id !== undefined) {
//         database.delete('run', { _id: req.params.id }, (err) => {
//             if (err) return res.status(500).send({ error: 'Could not delete run.' })
//             return res.status(200).send({});
//         })
//     }
// }
// module.exports.updateSpeedrun = (req, res) => {
//     if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
//     let update = (req.params.id === undefined) ? false : true;
//     validateSpeedrun(req.body, (errors, data) => {
//         if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
//         if (update) {
//             database.find('run', { _id: req.params.id }, (err, result) => {
//                 if (err) return res.status(500).send({ error: 'Could not update run.' })
//                 for (const [key, value] of Object.entries(data)) {
//                     result[key] = value;
//                 }
//                 database.save(result)
//                 return res.status(200).send({});
//             });
//             return;
//         }
//         database.create('run', data, (err, result) => {
//             if (err) return res.status(500).send({ error: 'Error creating user.' })
//             return res.status(200).send({});
//         })
//     });
// }


// function validateSpeedrun(data, callback) {
//     let eventExists, runnersExist;
//     let errors = [];

//     // Event
//     if (data.event === undefined || data.event.length <= 0) errors.push({ item: 'event', code: 'Event is required.' })
//     else if (typeof data.event !== 'string') errors.push({ item: 'event', code: 'Event must be of type string.' })
//     else {
//         eventExists = new Promise((resolve, reject) => {
//             database.find('event', { _id: data.event }, (err, eventData) => {
//                 if (err) errors.push({ item: 'event', code: 'Unknown error when fetching events.' })
//                 else if (eventData === undefined) errors.push({ item: 'event', code: 'Event does not exist.' })
//                 resolve();
//             })
//         })
//     }

//     // Game
//     if (data.game === undefined || data.game.length <= 0) errors.push({ item: 'game', code: 'Game name is required.' })
//     else if (typeof data.game !== 'string') errors.push({ item: 'game', code: 'Game name must be of type string.' })
//     else if (data.name.game > 60) errors.push({ item: 'game', code: 'Game name is too long.' })

//     // Category
//     if (data.category === undefined || data.category.length <= 0) errors.push({ item: 'category', code: 'Category is required.' })
//     else if (typeof data.category !== 'string') errors.push({ item: 'category', code: 'Category must be of type string.' })
//     else if (data.category.length > 60) errors.push({ item: 'category', code: 'Category is too long.' })

//     // Runners
//     if (data.runners === undefined || data.runners.length <= 0) errors.push({ item: 'runners', code: 'Runners is required.' })
//     else if (typeof data.runners !== 'array') errors.push({ item: 'runners', code: 'Runners be of type array.' })
//     else {
//         runnersExist = new Promise((resolve, reject) => {
//             let runnerList = data.runners;
//             data.runners = [];
//             for (const runner of runnerList) {
//                 if (runner.id === undefined || runner.id.length <= 0) errors.push({ item: 'runners', code: 'Runners is required.' })
//                 database.find('runner', { _id: runner.id }, (err, runnerData) => {
//                     if (err) errors.push({ item: 'runners', code: 'Unknown error when fetching runners.' })
//                     else if (runnerData === undefined) errors.push({ item: 'runners', code: 'Runner does not exist.' })
//                     else data.runners.push({ name: runnerData.name, id: runnerData.id })
//                 })
//             }
//             resolve();
//         })
//     }

//     // Multiplayer
//     if (data.multiplayer === undefined) data.multiplayer = false;

//     // Start Time
//     if (data.startTime === undefined || data.startTime.length <= 0) errors.push({ item: 'startTime', code: 'Start time is required.' })
//     else if (typeof data.startTime !== 'string') errors.push({ item: 'startTime', code: 'Start time must be of type string.' })
//     else if (!isIsoDate(data.startTime)) errors.push({ item: 'startTime', code: 'Start time must be a valid ISO 8601 string.' })
//     else data.startTime = new Date(data.startTime);

//     // Estimate
//     if (data.estimate === undefined || data.estimate.length <= 0) errors.push({ item: 'estimate', code: 'Estimage is required.' })
//     else if (typeof data.estimate !== 'string') errors.push({ item: 'estimate', code: 'Estimate must be of type string.' })
//     else if (!/^[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(data.estimate)) errors.push({ item: 'estimate', code: 'Invalid estimate format.' })

//     // Final Time
//     if (data.finalTime !== undefined && data.finalTime.length > 0) {
//         if (typeof data.finalTime !== 'string') errors.push({ item: 'finalTime', code: 'Final time must be of type string.' })
//         else if (!/^[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(data.finalTime)) errors.push({ item: 'finalTime', code: 'Invalid final time format.' })
//     }

//     // Final Setup Time
//     if (data.finalSetupTime !== undefined && data.finalSetupTime.length > 0) {
//         if (typeof data.finalSetupTime !== 'string') errors.push({ item: 'finalSetupTime', code: 'Final setup time must be of type string.' })
//         else if (!/^[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(data.finalSetupTime)) errors.push({ item: 'finalSetupTime', code: 'Invalid final setup time format.' })
//     }

//     // Release Year
//     if (data.releaseYear !== undefined && typeof data.startTime !== 'number') errors.push({ item: 'releaseYear', code: 'Release year must be of type number.' })

//     Promise.all([eventExists, runnersExist]).then(() => callback(errors, data))
// }