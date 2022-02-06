const fetch = require('node-fetch');
const { v4: uuid } = require('uuid');

module.exports = () => {
    console.log('donation module started!')

    module.exports.verifyIPN = (req, res) => {
        res.sendStatus(200)
        let body = "cmd=_notify-validate" + JSON.stringify(req.body);
        fetch('https://ipnpb.sandbox.paypal.com/cgi-bin/webscr', {
            method: 'POST',
            headers: {
                'Connection': 'close'
            },
            body: body,
            strictSSL: true,
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        }).then((data) => console.log(req.body))
    }
}