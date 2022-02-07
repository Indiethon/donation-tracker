const { v4: uuid } = require('uuid');
const apiKeys = require('./keys.json');

//console.log(apiKeys[0]);

module.exports.load = (tracker) => {

    // Unsecured API routes.
    tracker.app.get('/api/donation/create', (req, res) => res.status(200).send({ donationId: uuid() }))
    tracker.app.post('/api/donation/ipn', (req, res) => tracker.modules.donation.verifyIPN(req, res))
}