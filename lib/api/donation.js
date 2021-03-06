const fetch = require('node-fetch');
const mongoose = require('mongoose')
const events = require('events');
const { v4: uuid } = require('uuid');
const donationEvent = new events.EventEmitter();
donationEvent.setMaxListeners(25);
let sendValue = {};

let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.createDonation = async (req, res) => {
    let event = await database.models['event'].findOne({ active: true }).populate('charity');
    let donor = await getDonor(req.body, res);
    let donationData = {
        eventId: event.id,
        donorId: donor.id,
        alias: (req.body.alias === undefined || req.body.alias === '') ? 'Anonymous' : req.body.alias,
        amount: req.body.amount,
        incentives: [],
        custom: [],
        comment: req.body.comment,
        paypalStatus: null,
        timestamp: Date.now(),
        verified: false,
    }
    let totalAmount = 0;
    for (const incentive of req.body.incentives) {
        totalAmount = totalAmount + incentive.amount;
        let incentiveData = {
            incentiveId: incentive.id,
            option: incentive.option,
            amount: incentive.amount,
        }
        if (incentive.userOption !== undefined) {
            let optionId = await createIncentiveOption(incentive.id, incentive.userOption);
            incentiveData.option = optionId;
        }
        donationData.incentives.push(incentiveData)
    }
    // for (const custom of req.body.custom) {
    //     let customData = {
    //         customId: custom.id,
    //         value: custom.value,
    //     }
    //     donationData.custom.push(customData);
    // }
    if (event.autoScreen) {
        let wordFilters = await database.models['wordFilter'].find({});
        donationData.visible = true;
        for (const filter of wordFilters) {
            if (donationData.comment.includes(filter.allowed)) donationData.visible = true;
            else if (donationData.comment.includes(filter.blocked)) donationData.visible = false;
        }
        donationData.verified = true;
    }

    if (parseFloat(totalAmount) > parseFloat(req.body.amount)) return res.status(500).send({ error: 'Incentive amount is above total donation amount! ' })
    database.models['donation'].create(donationData, (err, data) => {
        if (err) return returnErrors(err, res);
        res.status(200).send({
            id: data.id,
            event: event.name,
            url: (tracker.config.paypal.useSandbox) ? 'https://www.sandbox.paypal.com/donate' : 'https://www.paypal.com/donate',
            logo: event.charity.logoUrl,
            payee: event.charity.payee,
            currency: tracker.config.paypal.currency,
        })
    })
}

module.exports.verifyIPN = (req, res) => {
    res.sendStatus(200);
    let fetchUrl = (tracker.config.paypal.useSandbox) ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr' : 'https://ipnpb.paypal.com/cgi-bin/webscr';
    let body = "cmd=_notify-validate" + JSON.stringify(req.body);
    fetch(fetchUrl, {
        method: 'POST',
        headers: {
            'Connection': 'close'
        },
        body: body,
        strictSSL: true,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
        contentType: 'application/json'
    }).then(async () => {
        let customData = JSON.parse(req.body.custom);
        let event = await database.models['event'].findOne({ active: true });
        let donation = await database.models['donation'].findOne({ _id: customData.donationId });
        let donor = await database.models['donor'].findOne({ _id: donation.donorId })
        donation.paypalStatus = req.body.payment_status;
        donor.donations.push(donation._id);
        if (!donor.alias.includes(donation.alias)) donor.alias.push(donation.alias);
        if (req.body.payment_status === 'Completed') donation.completed = true;
        donor.save();
        donation.save();
        checkIncentives();
        prepareDonationEvent(donation, event);
        return;
    }).catch(err => {
        console.warn('----- Donation Error -----')
        console.error(err.stack);
        console.error(JSON.stringify(req.body, null, 2))
        console.warn('A donation error has occured, and the donation was not verified. Please send the above error message to the developers!')
    });
}

// Create donor profile (if it doesn't already exist)
async function getDonor(data, res, callback) {
    let donor = await database.models['donor'].findOne({ email: data.email });
    if (donor === undefined || donor === null) {
        let donor = database.models['donor'].create({
            alias: [data.alias],
            email: data.email,
        });
        return donor;
    }
    return donor;
}

async function createIncentiveOption(id, option) {
    let incentive = await database.models['incentive'].findOne({ _id: id });
    let optionId = mongoose.Types.ObjectId();
    incentive.options.push({
        _id: optionId,
        name: option,
        userOption: true,
    })
    incentive.save();
    return optionId;
}

async function checkIncentives() {
    let incentives = await database.models['incentive'].find({ active: true, type: 'target' });
    for (let incentive of incentives) {
        incentive.getStats((cb) => {
            if (cb >= incentive.goal) {
                incentive.active = false;
                incentive.save();
            }
        })
    }
}

async function prepareDonationEvent(donation, event) {
    let data = { donation: donation }
    await event.getStats((cb) => data.eventStats = cb);
    donationEvent.emit('change', data);
}

module.exports.testEventSource = (req, res) => {
    donationEvent.emit('change', { test: true });
    res.status(200).send({});
}

module.exports.donationEventSource = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let test = uuid();

    sendValue[test] = (newVal) => {
        res.write(`data: ${JSON.stringify(newVal)}\n\n`)
        return;
    }

    donationEvent.on('change', sendValue[test]);

    res.on('close', () => {
        donationEvent.removeListener('change', sendValue[test]);
        res.end()
        return;
    });
    return;
    // currentMatch.on('change', (newVal) => res.write(`data: ${JSON.stringify(newVal)}\n\n`))
}

module.exports.fetchDonation = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['donation'].findOne({ _id: req.params.id }).populate('donor').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving donation data.' })
            return res.status(200).send(data)
        })
    }
    else if (req.params.event !== undefined) {
        database.models['donation'].find({ eventId: req.params.event }).populate('donor').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving donation data.' })
            let sortedDonors = data.sort((a, b) => b.timestamp - a.timestamp)
            return res.status(200).send(sortedDonors)
        })
    }
    else {
        database.models['donation'].find({}).populate('donor').exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving donation data.' })
            let sortedDonors = data.sort((a, b) => b.timestamp - a.timestamp)
            return res.status(200).send(sortedDonors)
        })
    }
}

module.exports.deleteDonation = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['donation'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete donation.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateDonation = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['donation'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    database.models['donation'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
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