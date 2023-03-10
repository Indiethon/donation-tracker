let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchGroup = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['group'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving group data.' })
            return res.status(200).send(data)
        })
    }
    else {
        database.models['group'].find({}).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving group data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteGroup = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['group'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete group.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateGroup = async (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        let group = await database.models['group'].findOne({ _id: req.params.id })
        if (!group) return res.status(500).send({ error: 'Error retriving group data.' })
        for (const [key, value] of Object.entries(req.body)) {
            group[key] = value;
        }
        let savedData = await group.save()
        if (!savedData) return returnErrors(err, res)
        res.status(200).send(savedData)
        let json = { userId: res.locals.id, resourceId: savedData._id, model: 'group', action: 'edit' };
        return json;
    }

    let group = await database.models['group'].create(req.body);
    if (!group) return returnErrors(err, res);
    return res.status(200).send(group);
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            console.error(errors.errors[error])
            if (errors.errors[error].message.includes('Cast to')) errors.errors[error].message = 'Group is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}