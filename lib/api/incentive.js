let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchIncentive = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['incentive'].findOne({ _id: req.params.id }).populate('run').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving incentive data.' })
            return res.status(200).send(data)
        })
    }
    else if (req.params.event !== undefined) {
        database.models['incentive'].find({ eventId: req.params.event }).populate('run').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving incentive data.' })
            let sortedRuns = data.sort((a, b) => b.startTime - a.startTime)
            return res.status(200).send(sortedRuns)
        })
    }
    else {
        database.models['incentive'].find({}).populate('run').exec((err, data) => {
            console.log(err)
            if (err) return res.status(500).send({ error: 'Error retriving incentive data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteIncentive = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['incentive'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete incentive.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateIncentive = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['incentive'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['incentive'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            if (errors.errors[error].message.includes('Cast to')) errors.errors[error].message = 'Run is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}