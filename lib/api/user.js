const bcrypt = require('bcrypt')
let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchUser = (req, res) => {
    if (req.params.id !== undefined) {
        database.models['user'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving user data.' })
            return res.status(200).send(data)
        })
    }
    else {
        database.models['user'].find({}).exec((err, data) => {
            if (err) return res.status(500).send({ error: 'Error retriving user data.' })
            return res.status(200).send(data)
        })
    }
}

module.exports.deleteUser = (req, res) => {
    if (req.params.id !== undefined) {
        if (req.params.id === res.locals.id) return res.status(403).send({ error: 'Cannot delete your own account.' })
        database.models['user'].findOne({ _id: req.params.id }).exec((err, data) => {
            if (data.username === 'admin') return res.status(403).send({ error: 'Cannot delete the default admin account.' })
            database.models['user'].deleteOne({ _id: req.params.id }, (delError) => {
                if (delError) return res.status(500).send({ error: 'Could not delete user.' })
                return res.status(200).send({});
            });
        })
    }
}
module.exports.updateUser = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    if (req.params.id !== undefined) {
        database.models['user'].findOne({ _id: req.params.id }).exec((err, data) => {
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
    if (req.body.password === undefined) req.body.password = bcrypt.hashSync('password', 10)
    database.models['user'].create(req.body, (err, data) => {
        if (err) return returnErrors(err, res);
        return res.status(200).send(data);
    })
}

module.exports.updatePassword = (req, res) => {
    database.models['user'].findOne({ _id: res.locals.id }).exec((err, data) => {
        bcrypt.compare(req.body.oldPassword, data.get('password', null, { getters: false }), (error, match) => {
            if (match && req.body.newPassword === req.body.confirmPassword) {
                data.password = bcrypt.hashSync(req.body.newPassword, 10);
                data.save();
                return res.status(200).send({});
            }
            else if (match) return res.status(409).send({ error: 'Invalid input.', errorCodes: [{ item: 'confirmPassword', code: 'Passwords do not match.' }] })
            else return res.status(409).send({ error: 'Invalid input.', errorCodes: [{ item: 'oldPassword', code: 'Current password is incorrect.' }] })
        });
    });
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