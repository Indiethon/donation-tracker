let tracker, database;
let emailLib = require('../email/email.js');

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchEmailAddress = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['emailAddress'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving email address data.' })
            return res.status(200).send(data)
        })
    }
    else {
        database.models['emailAddress'].find({}).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving email address data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteEmailAddress = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['emailAddress'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete email address.' })
            return res.status(200).send({});
        });
    }
}

module.exports.updateEmailAddress = async (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['emailAddress'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    let emailVerify = await emailLib.verifyEmail(req.body);
    if (emailVerify[0]) return res.status(403).send({ error: 'Unable to authenticate with the SMTP server. Please check your credentials and try again.', errorCodes: [{ item: 'emailAddress', code: emailVerify[1] }] });
    database.models['emailAddress'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

function returnErrors(errors, res) {
    let errorList = [];
    if (errors.errors !== undefined) {
        for (const error in errors.errors) {
            errorList.push({ item: error, code: errors.errors[error].message.charAt(0).toUpperCase() + errors.errors[error].message.slice(1) })
        }
    }
    return res.status(409).send({ error: 'Invalid input.', errorCodes: errorList })
}