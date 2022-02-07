const fetch = require('node-fetch');
const { v4: uuid } = require('uuid');
const { addUser } = require('../admin');

module.exports = (tracker) => {
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
        }).then((data) => {
            console.log(JSON.parse(req.body.custom))
            console.log('Payment Status: ' + req.body.payment_status)
        })
    }
    //setTimeout(() => tracker.modules.admin.addUser({ id: '123', username: 'nicnacnic', password: 'test', lastLogin: new Date(), isSuperuser: true, isStaff: true, isVolunteer: false, firstName: 'Nicolas', lastName: 'Baror', email: 'nicnacnic@nicnacnic.com', dateCreated: new Date()}), 5000)
}