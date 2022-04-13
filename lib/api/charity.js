const tzList = require('tzdata');
let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchCharity = (req, res) => {
    if (req.params.id !== undefined) {
        database.find('charity', { _id: req.params.id }, (err, data) => {
            if (!err && data !== undefined) return res.status(200).send(data);
        })
    }
    else {
        let charityList = [];
        database.findAll('charity', {}, (err, data) => {
            if (err) return res.status(500).send({ error: 'Could not fetch charities.' })
            if (data === undefined) return res.status(200).send([]);
            let sortecCharities = data.sort((a, b) => b.endDate - a.endDate)
            for (const charity of sortecCharities) {
                charityList.push(charity)
            }
            res.status(200).send(charityList)
        })
    }
}

// module.exports.generateEventList = (req, res) => {
//     let eventList = [];
//     database.findAll('event', {}, (err, data) => {
//         if (err) return res.status(500).send({ error: 'Could not fetch events.' })
//         if (data === undefined) return res.status(200).send([]);
//         let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
//         for (const event of sortedEvents) {
//             eventList.push(event.name)
//         }
//         res.status(200).send(eventList)
//     })
// }

module.exports.deleteCharity = (req, res) => {
    if (req.params.id !== undefined) {
        database.delete('charity', { _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete charity.' })
            database.findAll('event', { charityId: req.params.id }, (err2, eventList) => {
                if (err2) return res.status(500).send({ error: 'Could not delete charity.' })
                for (const event of eventList) {
                    event['charityName'] = '';
                    event['charityId'] = '';
                    database.save(event)
                } 
                return res.status(200).send({});
            })
            return;
        })
    }
}
module.exports.updateCharity = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    let update = (req.params.id === undefined) ? false : true;
    validateCharity(req.body, update, (errors, data) => {
        if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
        if (update) {
            database.find('charity', { _id: req.params.id }, (err, result) => {
                if (err) return res.status(500).send({ error: 'Could not update charity.' })
                for (const [key, value] of Object.entries(data)) {
                    result[key] = value;
                }
                database.save(result)
                database.findAll('event', { charityId: req.params.id }, (err2, eventList) => {
                    if (err2) return res.status(500).send({ error: 'Could not update charity.' })
                    for (const event of eventList) {
                        event['charityName'] = result.name;
                        database.save(event)
                    } 
                    return res.status(200).send({});
                })
                return;
            });
            return;
        }
        database.create('charity', data, (err, result) => {
            if (err) return res.status(500).send({ error: 'Error creating charity. ' })
            return res.status(200).send({});
        })
    });
}


function validateCharity(data, update, callback) {
    let nameUnique;
    let errors = [];

    // Name
    if (data.name === undefined || data.name.length <= 0) errors.push({ item: 'name', code: 'Charity name is required.' })
    else if (typeof data.name !== 'string') errors.push({ item: 'name', code: 'Charity name must be of type string.' })
    else if (data.name.length > 40) errors.push({ item: 'name', code: 'Charity name is too long.' })
    else {
        nameUnique = new Promise((resolve, reject) => {
            database.find('charity', { name: data.name }, (err, nameData) => {
                if (err) errors.push({ item: 'name', code: 'Unknown error when fetching charities.' })
                else if (nameData !== undefined && update && data.name !== nameData.name) errors.push({ item: 'name', code: 'Charity name is already in use.' })
                else if (nameData !== undefined && !update) errors.push({ item: 'name', code: 'Charity name is already in use.' })
                resolve();
            })
        })
    }

    // Description 
    if (data.description !== undefined) {
        if (typeof data.description !== 'string') errors.push({ item: 'description', code: 'Description must be of type string.' })
        else if (data.description.length > 500) errors.push({ item: 'description', code: 'Description is too long.' })
    }

    // Payee
    if (data.payee === undefined || data.payee.length <= 0) errors.push({ item: 'payee', code: 'Payee is required.' })
    else if (typeof data.payee !== 'string') errors.push({ item: 'payee', code: 'Payee must be of type string.' })
    else if (!data.payee.includes('@')) errors.push({ item: 'payee', code: 'Payee must be a valid email.' })

    // Logo URL
    if (data.logoUrl !== undefined) {
        if (typeof data.logoUrl !== 'string') errors.push({ item: 'logoUrl', code: 'Logo URL must be of type string.' })
        else if (data.logoUrl.length > 500) errors.push({ item: 'logoUrl', code: 'Logo URL is too long.' })
    }

    Promise.all([nameUnique]).then(() => callback(errors, data))
}