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
        database.models['user'].deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete user.' })
            return res.status(200).send({});
        });
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
    
    // let update = (req.params.id === undefined) ? false : true;
    // validateUser(req.body, req.params.id, update, (errors, data) => {
    //     if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
    //     if (update) {
    //         database.find('user', { _id: req.params.id }, (err, result) => {
    //             if (err) return res.status(500).send({ error: 'Could not update user.' })
    //             for (const [key, value] of Object.entries(data)) {
    //                 result[key] = value;
    //             }
    //             database.save(result)
    //             return res.status(200).send({});
    //         });
    //         return;
    //     }
    //     bcrypt.hash('password', 10, (err, hash) => {
    //         data.password = hash;
    //         database.create('user', data, (err, result) => {
    //             if (err) return res.status(500).send({ error: 'Error creating user.' })
    //             return res.status(200).send({});
    //         })
    //     });
    // });
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


// function validateUser(data, id, update, callback) {
//     let nameUnique;
//     let errors = [];

//     // Username
//     if (data.username === undefined || data.username.length <= 0) errors.push({ item: 'username', code: 'Username is required.' })
//     else if (typeof data.username !== 'string') errors.push({ item: 'username', code: 'Username must be of type string.' })
//     else if (data.username.length > 40) errors.push({ item: 'username', code: 'Username is too long.' })
//     else {
//         nameUnique = new Promise((resolve, reject) => {
//             database.find('user', { username: data.username }, (err, nameData) => {
//                 if (err) errors.push({ item: 'username', code: 'Unknown error when fetching users.' })
//                 else if (nameData !== undefined && id !== undefined && update) {
//                     if (id !== nameData.id && data.username === nameData.username) errors.push({ item: 'username', code: 'Username is already in use.' })
//                 }
//                 else if (nameData !== undefined && !update) errors.push({ item: 'username', code: 'Username is already in use.' })
//                 resolve();
//             })
//         })
//     }
    
//     // else {
//     //     nameUnique = new Promise((resolve, reject) => {
//     //         database.find('charity', { username: data.username }, (err, nameData) => {
//     //             if (err) errors.push({ item: 'username', code: 'Unknown error when fetching users.' })
//     //             else if (nameData !== undefined && update && data.username !== nameData.name) errors.push({ item: 'username', code: 'Username is already in use.' })
//     //             else if (nameData !== undefined && !update) errors.push({ item: 'username', code: 'Username is already in use.' })
//     //             resolve();
//     //         })
//     //     })
//     // }

//     Promise.all([nameUnique]).then(() => callback(errors, data))
// }