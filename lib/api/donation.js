const fetch = require('node-fetch')
let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.createDonation = (req, res) => {
    database.getActiveEvent((err, event) => {
        if (err) return res.status(500).send({ error: 'Error finding active event.' });
        if (event === undefined) return res.status(404).send({ error: 'There is no active event.' });
        verifyDonation(req.body, event.minDonation, (errors) => {
            if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors });
            createDonorProfile(req.body, res, (result) => {
                let data = {
                    event: event.id,
                    donor: result.id,
                    alias: (req.body.alias === undefined || req.body.alias === '') ? 'Anonymous' : req.body.alias,
                    currency: event.currency,
                    amount: req.body.amount,
                    comment: req.body.comment,
                    incentives: req.body.incentives,
                    custon: req.body.custom,
                    timestamp: Date.now(),
                    completed: false,
                    verified: false,
                    visible: false,
                }
                createDonationData(data, event, res);
            })
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
    }).then((data) => {
        database.getActiveEvent((err, result) => {
            if (err) return;
            if (req.body.payment_status === 'Completed') {
                database.find('donation', { id: req.body.custom }, (err2, donation) => {
                    if (err2) return;
                    addDonationToTotal(donation);
                    addDonationToDonor(req.body.custom);
                })
            }
        })
    })
}

function verifyDonation(data, minDonation, callback) {
    let errors = [];

    // Email
    if (data.email === undefined || data.email.length <= 0) errors.push({ item: 'email', code: 'Email is required.' })
    else if (!data.email.includes('@') || !data.email.includes('.')) errors.push({ item: 'email', code: 'Email is invalid.' })
    else if (data.email.length > 255) errors.push({ item: 'email', code: 'Email is too long.' })

    // Amount
    if (data.amount === undefined) errors.push({ item: 'amount', code: 'Amount is required.' })
    if (typeof data.amount !== 'number') errors.push({ item: 'amount', code: 'Amount must be of type number.' })
    if (data.amount < minDonation) errors.push({ item: 'amount', code: `Amount is below the required minimum.` })

    // Incentives 
    // data.incentivs.forEach(incentive => {
    //     database.find('incentive', { id: incentive.id }, (err, incentiveData) => {
    //         if (err || incentiveData === undefined) {
    //             errors.push({ item: 'incentives', code: `Invalid incentives.` })
    //         }
    //     })
    // })

    callback(errors);
    // id: data.donationId,
    // name: (document.getElementById('name').value !== '') ? document.getElementById('name').value : 'Anonymous',
    // email: document.getElementById('email').value,
    // amount: Number(document.getElementById('amount').value).toFixed(2),
    // comment: document.getElementById('comment').value,
    // incentives: {},
    // custom: {},
}

// Create donor profile (if it doesn't already exist)
function createDonorProfile(data, res, callback) {
    database.find('donor', { email: data.email }, (err, result) => {
        if (err) return res.status(500).send({ error: 'Error retriving donor data.' })
        if (result === undefined) {
            let donor = {
                alias: data.alias,
                email: data.email,
            }
            database.create('donor', donor, (err, donorProfile) => {
                if (err) return res.status(500).send({ error: 'Error creating new donor profile.' })
                callback(donorProfile);
                return;
            })
        }
        result.alias = data.alias;
        database.save(result);
        callback(result);
        return;
    })
}

// Create donation and send return.
function createDonationData(data, event, res) {
    database.find('charity', { id: event.charityId }, (err, charity) => {
        if (err || charity === undefined) return res.status(500).send({ error: 'Error fetching charity data.' });
        database.create('donation', data, (err2, donation) => {
            if (err2 || donation === undefined) return res.status(500).send({ error: 'Error creating donation.' })
            res.status(200).send({
                id: donation._id,
                url: (tracker.config.paypal.useSandbox) ? 'https://www.sandbox.paypal.com/donate' : 'https://www.paypal.com/donate',
                payee: charity.payee,
                currency: event.currency,
            })
        })
    })
}

function addDonationToTotal(donation) {
    database.getActiveEvent((err, event) => {
        if (err) return;
        database.find('charity', { id: event.charityId }, (err2, charity) => {
            if (err2) return;
            donation.completed = true;
            if (event.autoScreen) donation.verified = true;
            database.save(donation);
        })
    })
}

function addDonationToDonor(id) {
    database.find('donor', { id: id }, (err, donor) => {
        if (err) return;
        donor.donations.push(id);
        database.save(donor);
    })
}