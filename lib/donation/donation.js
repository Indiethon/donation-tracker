const https = require('https');
const mongoose = require('mongoose')

let tracker, database;
let wsClients = [];

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.addClient = (client) => {
    wsClients.push(client);
}

module.exports.createDonation = async (req, res) => {
    let event = await database.findOne('event', { active: true }, ['charity']);
    let donor = await getDonor(req.body, res);
    let donationData = {
        eventId: event._id,
        donorId: donor._id,
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
        if (incentive.userOption) {
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
        let wordFilters = await database.findAll('wordFilter');
        donationData.visible = true;
        for (const filter of wordFilters) {
            if (donationData.comment.includes(filter.allowed)) donationData.visible = true;
            else if (donationData.comment.includes(filter.blocked)) donationData.visible = false;
        }
        donationData.verified = true;
    }

    if (parseFloat(totalAmount) > parseFloat(req.body.amount)) return res.status(500).send({ error: 'Incentive amount is above total donation amount! ' })
    let [createErr, createData] = await database.create('donation', donationData);
    let donorDonations = donor.donations;
    donorDonations.push(createData._id);
    let donorAliases = donor.alias;
    if (!donorAliases.includes(createData.alias)) donorAliases.unshift(createData.alias);
    let [donorErr, donorData] = await database.update('donor', { _id: donor._id }, {
        donations: donorDonations,
        alias: donorAliases,
    })
    res.status(200).send({
        id: createData.id,
        event: event.name,
        url: (tracker.config.paypal.useSandbox) ? 'https://www.sandbox.paypal.com/donate' : 'https://www.paypal.com/donate',
        logo: event.charity.logoUrl,
        payee: event.charity.payee,
        currency: tracker.config.paypal.currency,
    })
}

module.exports.verifyIPN = async (req, res) => {
    res.sendStatus(200);
    let body = new URLSearchParams(req.body) + '&cmd=_notify-validate';
    let request = https.request({
        host: (tracker.config.paypal.useSandbox) ? 'www.sandbox.paypal.com' : 'www.paypal.com',
        method: 'POST',
        path: '/cgi-bin/webscr',
        headers: {
            'Content-Length': body.length,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, handleResponse);
    request.write(body);
    request.on('error', (err) => ipnError(err));
    request.end();

    function handleResponse(response) {
        let responseData = [];

        response.on('data', (data) => {
            responseData.push(data);
        });

        response.on('end', function reponseDone() {
            let msg = responseData.join('');

            if (msg === 'VERIFIED') ipnSuccess(req.body)
            else {
                ipnError(new Error(), req.body, responseData)
            }
        });

    }

    async function ipnSuccess(ipnData) {
        let event = await database.findOne('event', { active: true });
        let [donationErr, donation] = await database.update('donation', { _id: ipnData.custom }, {
            paypalStatus: ipnData.payment_status,
            completed: true,
        })
        checkIncentives();
        tracker.sendWsMessage({ type: 'donationEvent', code: 200, data: donation })
        return;
    }

    function ipnError(err, ipnData) {
        console.warn('----- Donation Error -----')
        console.error(err.stack);
        console.error(JSON.stringify(ipnData, null, 2))
        console.error(responseData)
        console.warn('A donation error has occured, and the donation was not verified. Please send the above error message to the developers!');
    }
}

// Create donor profile (if it doesn't already exist)
async function getDonor(data, res, callback) {
    return new Promise(async (resolve, reject) => {
        let donor = await database.findOne('donor', { email: data.email });
        if (!donor) {
            let [error, donor] = await database.create('donor', {
                alias: [data.alias],
                email: data.email,
            });
            return resolve(donor);
        }
        return resolve(donor);
    })
}

async function createIncentiveOption(id, option) {
    return new Promise(async (resolve, reject) => {
        let incentive = await database.findOne('incentive', { _id: id });
        let optionId = mongoose.Types.ObjectId();
        let incentiveOptions = incentive.options;
        incentiveOptions.push({
            _id: optionId,
            name: option,
            userOption: true,
        })
        await database.update('incentive', { options: incentiveOptions })
        return resolve(optionId);
    })
}

async function checkIncentives() {
    return new Promise(async (resolve, reject) => {
        let incentives = await database.find('incentive', { active: true, type: 'target' });
        for (let incentive of incentives) {
            let stats = await database.getStats('incentive', incentive);
            if (stats.total >= incentive.goal) await database.update('incentive', { _id: incentive._id }, {
                completed: true,
            })
        }
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