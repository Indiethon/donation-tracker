const tzList = require('tzdata');
let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchEvent = (req, res) => {
    if (req.params.id !== undefined) {
        database.find('event', { _id: req.params.id }, (err, data) => {
            if (!err && data !== undefined) return res.status(200).send(data);
        })
    }
    else if (req.path.includes('active')) {
        database.getActiveEvent((err, data) => {
            if (!err && data !== undefined) return res.status(200).send(data);
            return res.status(404).send({ error: 'There is no active event.' })
        })
    }
    else {
        let eventList = [];
        database.findAll('event', {}, (err, data) => {
            if (err) return res.status(500).send({ error: 'Could not fetch events.' })
            if (data === undefined) return res.status(200).send([]);
            let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
            for (const event of sortedEvents) {
                eventList.push(event)
            }
            res.status(200).send(eventList)
        })
    }
}

module.exports.generateEventList = (req, res) => {
    let eventList = [];
    database.findAll('event', {}, (err, data) => {
        if (err) return res.status(500).send({ error: 'Could not fetch events.' })
        if (data === undefined) return res.status(200).send([]);
        let sortedEvents = data.sort((a, b) => b.endDate - a.endDate)
        for (const event of sortedEvents) {
            eventList.push(event.name)
        }
        res.status(200).send(eventList)
    })
}

// Old
// module.exports.createEvent = (req, res) => {
//     if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
//     validateEvent(req.body, false, (errors, data) => {
//         if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
//         database.create('event', data, (err, event) => {
//             if (err) res.status(500).send({ error: 'Error creating event. ' })
//             res.status(200).send({});
//         })
//     })
// }

module.exports.deleteEvent = (req, res) => {
    if (req.params.id !== undefined) {
        database.delete('event', { _id: req.params.id }, (err) => {
            if (err) return res.status(500).send({ error: 'Could not delete event.' })
            return res.status(200).send({});
        })
    }
}
module.exports.updateEvent = (req, res) => {
    if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
    let update = (req.params.id === undefined) ? false : true;
    validateEvent(req.body, req.params.id, update, (errors, data) => {
        if (errors.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: errors })
        if (update) {
            database.find('event', { _id: req.params.id }, (err, result) => {
                if (err) return res.status(500).send({ error: 'Could not update event.' })
                for (const [key, value] of Object.entries(data)) {
                    result[key] = value;
                }
                database.save(result)
                return res.status(200).send({});
            });
            return;
        }
        database.create('event', data, (err, result) => {
            if (err) return res.status(500).send({ error: 'Error creating event. ' })
            return res.status(200).send({});
        })
    });
}


function validateEvent(data, id, update, callback) {
    let nameUnique, shortUnique, charityExists;
    const blockedShorts = ['all', 'active', 'tracker', 'create', 'edit', 'view', 'delete']
    let errors = [];

    // Name
    if (data.name === undefined || data.name.length <= 0) errors.push({ item: 'name', code: 'Event name is required.' })
    else if (typeof data.name !== 'string') errors.push({ item: 'name', code: 'Event name must be of type string.' })
    else if (data.name.length > 40) errors.push({ item: 'name', code: 'Event name is too long.' })
    else {
        nameUnique = new Promise((resolve, reject) => {
            database.find('event', { name: data.name }, (err, nameData) => {
                if (err) errors.push({ item: 'name', code: 'Unknown error when fetching events.' })
                else if (nameData !== undefined && update && data.name !== nameData.name) errors.push({ item: 'name', code: 'Event name is already in use.' })
                else if (nameData !== undefined && !update) errors.push({ item: 'name', code: 'Event name is already in use.' })
                resolve();
            })
        })
    }


    // Short
    if (data.short === undefined || data.short.length <= 0) errors.push({ item: 'short', code: 'Short is required.' })
    else if (typeof data.short !== 'string') errors.push({ item: 'short', code: 'Short must be of type string.' })
    else if (data.short.length < 4) errors.push({ item: 'short', code: 'Short is too short.' })
    else if (data.short.length > 40) errors.push({ item: 'short', code: 'Short is too long.' })
    else if (blockedShorts.includes(data.short)) errors.push({ item: 'short', code: 'This short cannot be used.' })
    else {
        shortUnique = new Promise((resolve, reject) => {
            database.find('event', { short: data.short }, (err, shortData) => {
                if (err) errors.push({ item: 'short', code: 'Unknown error when fetching events.' })
                else if (shortData !== undefined && id !== undefined && update) {
                    if (id !== shortData.id && data.short === shortData.short) errors.push({ item: 'short', code: 'Short is already in use.' })
                }
                else if (shortData !== undefined && !update) errors.push({ item: 'short', code: 'Short is already in use.' })
                resolve();
            })
        })
    }

    // Description 
    if (data.description !== undefined) {
        if (typeof data.description !== 'string') errors.push({ item: 'description', code: 'Description must be of type string.' })
        else if (data.description.length > 500) errors.push({ item: 'description', code: 'Description is too long.' })
    }

    // Charity ID 
    if (data.charity === undefined || data.charity.length <= 0) errors.push({ item: 'charity', code: 'Charity is required.' })
    else if (typeof data.charity !== 'string') errors.push({ item: 'charity', code: 'Charity must be of type string.' })
    else {
        charityExists = new Promise((resolve, reject) => {
            database.find('charity', { id: data.charity }, (err, charity) => {
                if (err) errors.push({ item: 'charity', code: 'Unknown error when fetching charity.' })
                else if (data === undefined) errors.push({ item: 'charity', code: 'Charity does not exist.' })
                else { data.charityId = charity.id; data.charityName = charity.name; }
                resolve();
            })
        })
    }

    // Target Amount
    if (data.targetAmount === undefined || data.targetAmount === null) errors.push({ item: 'targetAmount', code: 'Target amount is required.' })
    else if (typeof data.targetAmount !== 'number') errors.push({ item: 'targetAmount', code: 'Target amount must be of type number.' })
    else if (data.targetAmount <= 0) errors.push({ item: 'targetAmount', code: 'Target amount must be greater than zero.' })

    // Start Time
    if (data.startTime === undefined || data.startTime.length <= 0) errors.push({ item: 'startTime', code: 'Start time is required.' })
    else if (typeof data.startTime !== 'string') errors.push({ item: 'startTime', code: 'Start time must be of type string.' })
    else if (!isIsoDate(data.startTime)) errors.push({ item: 'startTime', code: 'Start time must be a valid ISO 8601 string.' })
    else data.startTime = new Date(data.startTime);

    // End Time
    if (data.endTime === undefined || data.endTime.length <= 0) errors.push({ item: 'endTime', code: 'End time is required.' })
    else if (typeof data.endTime !== 'string') errors.push({ item: 'endTime', code: 'End time must be of type string.' })
    else if (!isIsoDate(data.endTime)) errors.push({ item: 'endTime', code: 'End time must be a valid ISO 8601 string.' })
    else {
        let dateString = new Date(data.endTime);
        if (data.startTime === undefined || !data.startTime instanceof Date || dateString.getTime() <= data.startTime.getTime()) errors.push({ item: 'endTime', code: 'End time must be after the start time.' })
        else data.endTime = new Date(data.endTime);
    }

    // Prize Draw Time
    if (data.prizeTime !== undefined && data.prizeTime.length > 0) {
        if (typeof data.prizeTime !== 'string') errors.push({ item: 'prizeTime', code: 'Prize drawing time must be of type string.' })
        else if (!isIsoDate(data.prizeTime)) errors.push({ item: 'prizeTime', code: 'Prize drawing time must be a valid ISO 8601 string.' })
        else {
            let dateString = new Date(data.prizeTime);
            if (dateString.getTime() <= data.endTime.getTime()) errors.push({ item: 'prizeTime', code: 'Prize drawing time must be after the start time.' })
            else data.prizeTime = new Date(data.prizeTime);
        }
    }

    // Min Donation
    if (data.minDonation === undefined || data.minDonation === null) errors.push({ item: 'minDonation', code: 'Minimum donation is required.' })
    else if (typeof data.minDonation !== 'number') errors.push({ item: 'minDonation', code: 'Minimum donation must be of type number.' })
    else if (data.minDonation <= 0) errors.push({ item: 'minDonation', code: 'Minimum donation must be greater than zero.' })

    // Visible
    if (data.visible === undefined) data.visible = false;

    // Auto Screen
    if (data.autoScreen === undefined) data.autoScreen = false;

    // Active
    if (data.active === undefined) data.active = false;
    else if (data.active === true) {
        database.find('event', { active: true }, (err, activeData) => {
            if (!update && activeData !== undefined) errors.push({ item: 'active', code: 'There is already an active event.' })
            else if (activeData !== undefined && data.name !== activeData.name) errors.push({ item: 'active', code: 'There is already an active event.' })
        })
    }

    Promise.all([nameUnique, shortUnique, charityExists]).then(() => callback(errors, data))
}

function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    var d = new Date(str);
    return d.toISOString() === str;
}

const currencies = {
    'AUD': '$',
    'BRL': 'R$',
    'CAD': '$',
    'CNY': '¥',
    'CZK': 'Kč',
    'DKK': 'kr',
    'EUR': '€',
    'HKD': '$',
    'HUF': 'Ft',
    'ILS': '₪',
    'JPY': '¥',
    'MYR': 'RM',
    'MXN': '$',
    'TWD': 'NT$',
    'NZD': '$',
    'NOK': 'kr',
    'PHP': '₱',
    'PLN': 'zł',
    'GBP': '£',
    'RUB': '₽',
    'SGD': '$',
    'SEK': 'kr',
    'CHF': 'CHF',
    'THB': '฿',
    'USD': '$',
}