let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchBlurb = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['ad'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving ad data.' })
            return res.status(200).send(data)
        })
    }
    else if (res.locals.event !== undefined) {
        database.models['ad'].find({ eventId: res.locals.event }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving ad data.' })
            let sortedData = data.sort((a, b) => a - b)
            return res.status(200).send(sortedData)
        })
    }
    else {
        database.models['ad'].find({}).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving ad data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteBlurb = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['ad'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete ad.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateBlurb = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['ad'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['ad'].create(req.body, (err, data) => {
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