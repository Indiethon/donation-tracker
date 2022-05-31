let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchRunner = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['runner'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving runner data.' })
            return res.status(200).send(data)
        })
    }
    else {
        database.models['runner'].find({}).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving runner data.' })
            let sortedRunners = data.sort((a, b) => a.name.localeCompare(b.name))
            return res.status(200).send(sortedRunners)
        })
    }
}

module.exports.deleteRunner = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['runner'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete charity.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateRunner = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['runner'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['runner'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}


// module.exports.fetchRunner = (req, res) => {
//     if (req.params.id !== undefined) {
//         database.find('runner', { _id: req.params.id }, (err, data) => {
//             if (!err && data !== undefined) return res.status(200).send(data);
//         })
//     }
//     else {
//         database.findAll('runner', {}, (err, data) => {
//             if (err) return res.status(500).send({ error: 'Could not fetch runners.' })
//             if (data === undefined) return res.status(200).send([]);
//             res.status(200).send(data.sort())
//         })
//     }
// }

// module.exports.deleteRunner = (req, res) => {
//     if (req.params.id !== undefined) {
//         database.delete('charity', { _id: req.params.id }, (err) => {
//             if (err) return res.status(500).send({ error: 'Could not delete runner.' })
//             // database.findAll('event', { charityId: req.params.id }, (err2, eventList) => {
//             //     if (err2) return res.status(500).send({ error: 'Could not delete charity.' })
//             //     for (const event of eventList) {
//             //         event['charityName'] = '';
//             //         event['charityId'] = '';
//             //         database.save(event)
//             //     } 
//             //     return res.status(200).send({});
//             // })
//             return res.status(200).send({});
//         })
//     }
// }
// module.exports.updateRunner = (req, res) => {
//     if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
//     let update = (req.params.id === undefined) ? false : true;
//     validateRunner(req.body, update, (errors, data) => {
//         if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
//         if (update) {
//             database.find('runner', { _id: req.params.id }, (err, result) => {
//                 if (err) return res.status(500).send({ error: 'Could not update runner.' })
//                 for (const [key, value] of Object.entries(data)) {
//                     result[key] = value;
//                 }
//                 database.save(result)
//                 return res.status(200).send({});
//             });
//             return;
//         }
//         database.create('runner', data, (err, result) => {
//             if (err) return res.status(500).send({ error: 'Error creating runner.' })
//             return res.status(200).send({});
//         })
//     });
// }


// function validateRunner(data, update, callback) {
//     let nameUnique;
//     let errors = [];

//     // Name
//     if (data.name === undefined || data.name.length <= 0) errors.push({ item: 'name', code: 'Name is required.' })
//     else if (typeof data.name !== 'string') errors.push({ item: 'name', code: 'Name must be of type string.' })
//     else if (data.name.length > 60) errors.push({ item: 'name', code: 'Name is too long.' })
//     else {
//         nameUnique = new Promise((resolve, reject) => {
//             database.find('runner', { name: data.name }, (err, nameData) => {
//                 if (err) errors.push({ item: 'name', code: 'Unknown error when fetching runners.' })
//                 else if (nameData !== undefined && update && data.name !== nameData.name) errors.push({ item: 'name', code: 'Name is already in use.' })
//                 else if (nameData !== undefined && !update) errors.push({ item: 'name', code: 'Name is already in use.' })
//                 resolve();
//             })
//         })
//     }

//     Promise.all([nameUnique]).then(() => callback(errors, data))
// }