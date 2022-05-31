let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchEvent = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['event'].findOne({ _id: req.params.id }).populate('charity').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving event data.' })
            data.getStats((cb) => {
                data = data.toObject({ virtuals: true });
                data.stats = cb;
                return res.status(200).send(data)
            })
            return;
        })
    }
    else if (req.path.includes('active')) {
        database.models['event'].findOne({ active: true }).populate('charity').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving event data.' })
            data.getStats((cb) => {
                data = data.toObject({ virtuals: true });
                data.stats = cb;
                return res.status(200).send(data)
            })
            return;
        })
    }
    else {
        database.models['event'].find({}).populate('charity').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving event data.' })
            let sortedEvents = data.sort((a, b) => b.startTime - a.startTime)
            return res.status(200).send(sortedEvents)
        })
    }
}

module.exports.getStats = (req, res) => {
    database.models['event'].findOne({ _id: req.params.event }).exec((err, data) => {
        if (err) return res.status(500).send({ error: 'Error retriving event data.' })
        data.getStats((cb) => {
            return res.status(200).send(cb)
        })
        return;
    })
}

module.exports.generateEventList = (req, res) => {
    let eventList = {};
    database.models['event'].find().exec((err, data) => {
        if (err) return res.status(500).send({ error: 'Could not fetch events.' })
        let sortedEvents = data.sort((a, b) => b.startTime - a.startTime)
        for (const event of sortedEvents) {
            eventList[event.short] = event.name;
        }
        return res.status(200).send(eventList);
    });
}

module.exports.deleteEvent = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['event'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete event.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateEvent = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['event'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['event'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            if (errors.errors[error].message.includes('Cast to')) errors.errors[error].message = 'Charity is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}