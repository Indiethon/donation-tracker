let tracker, database;
let prizeLib = require('../prizes/prizes.js');

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchPrize = async (req, res) => {
    // let prizes;

    // try {
    //     switch (true) {
    //         case (req.query.id !== undefined): prizes = await database.models['prize'].find({ _id: req.query.id }).populate('winners'); break;
    //         case (req.query.event !== undefined): prizes = await database.models['prize'].find({ eventId: req.query.event }).populate('winners'); break;
    //         default: await database.models['prize'].find({}).populate('winners'); break;
    //     }

    //     // let prizes = await database.models['prize'].find({ $or: [{ $and: { _id: {$ne: undefined,} { _id:  $eq: req.query.id }}, { evnetId: req.query.event}, {short: req.query.event }]}).populate('winners')

    //     // // switch (true) {
    //     // //     case (req.params.id && res.locals.secure): prizes = await database.models['prize'].find({ _id: req.params.id }).populate('winners'); break;
    //     // //     case (req.params.id): prizes = await database.models['prize'].find({ _id: req.params.id }).select('-redemptionCode').populate('winners'); break;
    //     // //     case (res.locals.event && res.locals.secure): prizes = await database.models['prize'].find({ eventId: res.locals.event }).populate('winners'); console.log('secure'); break;
    //     // //     case (res.locals.event): prizes = await database.models['prize'].find({ eventId: res.locals.event }).select('redemptionCode').populate('winners'); console.log('this!'); break;
    //     // //     default: prizes = await database.models['prize'].find({}).populate('winners'); break;
    //     // // }

    //     let sortedPrizes = prizes.sort((a, b) => b.startTime - a.startTime);
    //     sortedPrizes = sortedPrizes.filter(a => {
    //         if (!res.locals.secure) a.redemptionCode = null;
    //     })
    //     return res.status(200).send(sortedPrizes)
    // } catch(e) {
    //     return res.status(500).send(e);
    //};

    if (req.params.id !== undefined) {
        database.models['prize'].findOne({ _id: req.params.id }).populate('winners').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize data.' })
            if (!res.locals.secure) data.redemptionCode = null;
            return res.status(200).send(data)
        })
    }
    else if (res.locals.event !== undefined) {
        database.models['prize'].find({ eventId: res.locals.event }).populate('winners').exec(async (err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize data.' })
            let sortedPrizes = data.sort((a, b) => b.startTime - a.startTime)
            for (let i = 0; i < sortedPrizes.length; i++) {
                if (!res.locals.secure) sortedPrizes[i].redemptionCode = null;
            }
            return res.status(200).send(sortedPrizes)
        })
    }
    else {
        database.models['prize'].find({}).populate('winners').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving prize data.' })
            for (let i = 0; i < data.length; i++) {
                if (!res.locals.secure) data[i].redemptionCode = null;
            }
            return res.status(200).send(data)
        })
    }
}

module.exports.deletePrize = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['prize'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete prize.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updatePrize = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['prize'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['prize'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

module.exports.drawPrizes = async (req, res) => {
    let prizeErr = await prizeLib.drawPrizes(req);
    return res.status(200).send({ message: prizeErr[1] })
}

module.exports.resetDrawnPrizes = (req, res) => {
    prizeLib.resetDrawnPrizes(req.params.event);
    return res.status(200).send({})
}


function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            if (errors.errors[error].message.includes('Cast to')) errors.errors[error].message = 'Donor is invalid.'
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}