let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchPrizeRedemption = async (req, res) => {
    if (req.params.id !== undefined) {
        database.models['prizeRedemption'].findOne({ _id: req.params.id }).populate('prize').populate('donor').populate('emailTemplate').populate('emailAddress').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize redemption data.' })
            if (!res.locals.secure) data.prize.redemptionCode = null;
            return res.status(200).send(data)
        })
    }
    else if (res.locals.event !== undefined) {
        database.models['prizeRedemption'].find({ eventId: res.locals.event }).populate('prize').populate('donor').populate('emailTemplate').populate('emailAddress').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize redemption data.' })
            let sortedPrizes = data.sort((a, b) => b.startTime - a.startTime)
            for (let i = 0; i < sortedPrizes.length; i++) {
                if (!res.locals.secure) sortedPrizes[i].prize.redemptionCode = null;
            }
            return res.status(200).send(sortedPrizes)
        })
    }
    else {
        database.models['prizeRedemption'].find({}).populate('prize').populate('donor').populate('event').populate('emailTemplate').populate('emailAddress').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize redemption data.' })
            for (let i = 0; i < data.length; i++) {
                if (!res.locals.secure) data[i].prize.redemptionCode = null;
            }
            return res.status(200).send(data)
        })
    }
}

module.exports.deletePrizeRedemption = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['prizeRedemption'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete prize redemption.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updatePrizeRedemption = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['prizeRedemption'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['prizeRedemption'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            if (errors.errors[error].message.includes('Cast to')) errors.errors[error].message = 'Prize is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}