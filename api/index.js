const { v4: uuid } = require('uuid');
const donation = require('./donation.js');
const apiKeys = require('./keys.json');

//console.log(apiKeys[0]);

module.exports.load = (app) => {

    // Unsecured API routes.
    app.get('/api/donation/create', (req, res) => res.status(200).send({ donationId: uuid() }))
    app.post('/api/donation/ipn', (req, res) => global.donation.verifyIPN(req, res))
}