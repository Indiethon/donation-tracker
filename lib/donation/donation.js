const fetch = require('node-fetch');
const { v4: uuid } = require('uuid');

module.exports = (tracker, database) => {

    module.exports.pendingDonations = [];

    module.exports.verifyIPN = (req, res) => {
        res.sendStatus(200)
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
            if (req.body.payment_status.includes('Completed')) {
                this.pendingDonations.splice(this.pendingDonations.indexOf(req.body.custom.id), 1);
                
            }
            console.log(req.body.custom)
            console.log('Payment Status: ' + req.body.payment_status)
        })
    }
}