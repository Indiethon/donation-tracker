const fetch = require('node-fetch');
const mongoose = require('mongoose')
const events = require('events');
const donationEvent = new events.EventEmitter();

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
        timestamp: Date.now(),
    }
    let totalAmount = 0;
    for (const incentive of req.body.incentives) {
        // console.log(JSON.stringify(incentive, null, 2))
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
    donationData.custom = [];
    if (totalAmount > req.body.amount) return res.status(500).send({ error: 'Incentive amount is above total donation amount! ' })
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
        agent: false
    }).then(async () => {
        let customData = JSON.parse(req.body.custom);
        if (req.body.payment_status !== 'Completed') return;
        let event = await database.models['event'].findOne({ active: true });
        let donation = await database.models['donation'].findOne({ _id: customData.donationId });
        let donor = await database.models['donor'].findOne({ _id: donation.donorId })
        donation.completed = true;
        if (event.autoScreen) {
            let wordFilters = await database.models['wordFilter'].find({});
            donation.visible = true;
            for (const filter of wordFilters) {
                if (donation.comment.includes(filter.allowed)) donation.visible = true;
                else if (donation.comment.includes(filter.blocked)) donation.visible = false;
            }
            donation.verified = true;
        }
        if (!donor.alias.includes(donation.alias)) donor.alias.push(donation.alias);
        if (req.body.address_street !== undefined) {
            let streetAddr = req.body.address_street.split('\r\n')
            donor.address = {
                name: req.body.address_name,
                street: streetAddr[0],
                apt: streetAddr[1],
                city: req.body.address_city,
                state: req.body.address_state,
                postalCode: req.body.address_zip,
                country: req.body.address_country_code,
            }
        }
        donor.save();
        donation.save();
        checkIncentives();
        prepareDonationEvent(donation);
        return;
    })
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

async function prepareDonationEvent(donation) {
    let data = {
        donation: donation,
    }
    let event = await database.models['event'].findOne({ active: true });
    await event.getStats((cb) => data.eventStats = cb);
    donationEvent.emit('change', data);
}

module.exports.donationEventSource = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    donationEvent.on('change', (newVal) => res.write(`data: ${JSON.stringify(newVal)}\n\n`));

    res.on('close', () => res.end());
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