const tzList = require('tzdata');

module.exports = (tracker, database) => {

    function createEvent(req, res) {
        if (req.body === undefined) res.status(400).send({ error: 'Missing parameters.' })
        validateEvent(req.body, (result) => {
            if (result.length > 0) return res.status(409).send({ error: 'Invalid input.', errorCodes: result })
            let event = new database.model['event'](req.body);
            database.save(event);
            res.status(200).send({});
        })
    }

    function validateEvent(data, callback) {
        let promises = nameUnique, shortUnique, charityExists;
        let errors = [];

        // Name
        if (data.name === undefined || data.name.length <= 0) errors.push({ item: 'name', code: 'Event name is required.' })
        else if (typeof data.name !== String) errors.push({ item: 'name', code: 'Event name must be of type string.' })
        else if (data.name.length > 40) errors.push({ item: 'name', code: 'Event name is too long.' })
        else {
            nameUnique = new Promise((resolve, reject) => {
                database.find('event', { name: data.name }, (err, data) => {
                    if (err) errors.push({ item: 'name', code: 'Unknown error when fetching events.' })
                    else if (data !== undefined) errors.push({ item: 'name', code: 'Event name must be unique.' })
                    resolve();
                })
            })
        }


        // Short
        if (data.short === undefined) errors.push({ item: 'short', code: 'Short is required.' })
        else if (typeof data.short !== String) errors.push({ item: 'short', code: 'Short must be of type string.' })
        else if (data.short.length < 4) errors.push({ item: 'short', code: 'Short is too short.' })
        else if (data.short.length > 40) errors.push({ item: 'short', code: 'Short is too long.' })
        else {
            shortUnique = new Promise((resolve, reject) => {
                database.find('event', { short: data.short }, (err, data) => {
                    if (err) errors.push({ item: 'short', code: 'Unknown error when fetching events.' })
                    else if (data !== undefined) errors.push({ item: 'short', code: 'Short must be unique.' })
                    resolve();
                })
            })
        }

        // Description 
        if (data.description !== undefined ) {
            if (typeof data.description !== String) errors.push({ item: 'description', code: 'Description must be of type string.' })
            else if (description.length > 500) errors.push({ item: 'description', code: 'Description is too long.' })
        }

        // Charity ID 
        if (data.charity === undefined || data.charity.length <= 0) errors.push({ item: 'charity', code: 'Charity is required.' })
        else if (typeof data.charity !== String) errors.push({ item: 'charity', code: 'Charity must be of type string.' })
        else {
            charityExists = new Promise((resolve, reject) => {
                database.find('charity', { id: data.charity }, (err, data) => {
                    if (err) errors.push({ item: 'charity', code: 'Unknown error when fetching charity.' })
                    else if (data === undefined) errors.push({ item: 'charity', code: 'Charity does not exist.' })
                    else { data.charityId = data.id; data.charityName = data.name; }
                    resolve();
                })
            })
        }

        // Target Amount
        if (data.target === undefined) errors.push({ item: 'target', code: 'Target amount is required.' })
        else if (typeof data.target !== Number) errors.push({ item: 'target', code: 'Target amount must be of type number.' })
        else if (data.target <= 0) errors.push({ item: 'target', code: 'Target amount must be greater than zero.' })

        // Currency
        if (data.currency === undefined || data.target.length <= 0) errors.push({ item: 'currency', code: 'Currency is required.' })
        else if (typeof data.currency !== String) errors.push({ item: 'currency', code: 'Currency must be of type string.' })
        else if (currencies[data.currency] === undefined) errors.push({ item: 'currency', code: 'Currency is not supported by PayPal. For supported currencies, see https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies ' })
        else { data.currencySymbol = currencies[data.currency] };
        
        // Timezone
        if (data.timezone === undefined || data.timezone.length <= 0) errors.push({ item: 'timezone', code: 'Timezone is required.' })
        else if (typeof data.timezone !== String) errors.push({ item: 'timezone', code: 'Timezone must be of type string.' })
        else if (tzList.zones[data.timezone] === undefined) errors.push({ item: 'timezone', code: 'Timezone is invalid. Example: America/New_York' })

        // Start Time
        if (data.startTime === undefined || data.startTime.length <= 0) errors.push({ item: 'startTime', code: 'Start time is required.' })
        else if (typeof data.startTime !== String) errors.push({ item: 'startTime', code: 'Start time must be of type string.' })
        else if (!isIsoDate(date.startTime)) errors.push({ item: 'startTime', code: 'Start time must be a valid ISO 8601 string.' })
        else date.startTime = new Date(date.startTime);

        // End Time
        if (data.endTime === undefined || data.endTime.length <= 0) errors.push({ item: 'endTime', code: 'End time is required.' })
        else if (typeof data.endTime !== String) errors.push({ item: 'endTime', code: 'End time must be of type string.' })
        else if (!isIsoDate(date.endTime)) errors.push({ item: 'endTime', code: 'End time must be a valid ISO 8601 string.' })
        else {
            let dateString = new Date(date.endTime);
            if (dateString.parse() <= date.startTime.parse()) errors.push({ item: 'endTime', code: 'End time must be after the start time.' })
            else date.endTime = new Date(date.endTime);
        }

        // Prize Draw Time
        if (date.prizeTime !== undefined) {
            if (typeof data.prizeTime !== String) errors.push({ item: 'prizeTime', code: 'Prize drawing time must be of type string.' })
            else if (!isIsoDate(date.prizeTime)) errors.push({ item: 'prizeTime', code: 'rize drawing time must be a valid ISO 8601 string.' })
            else {
                let dateString = new Date(date.prizeTime);
                if (dateString.parse() <= date.prizeTime.parse()) errors.push({ item: 'prizeTime', code: 'Prize drawing time must be after the start time.' })
                else date.prizeTime = new Date(date.prizeTime);
            }
        }

        // Min Donation
        if (data.minDonation === undefined) errors.push({ item: 'minDonation', code: 'Minimum donation is required.' })
        else if (typeof data.minDonation !== Number) errors.push({ item: 'minDonation', code: 'Minimum donation must be of type number.' })
        else if (data.minDonation <= 0) errors.push({ item: 'minDonation', code: 'Minimum donation must be greater than zero.' })

        // Visible
        if (data.visible === undefined) data.visible = false;

        // Auto Screen
        if (data.autoScreen === undefined) data.autoScreen = false;

        // Active
        if (data.active === undefined) data.active = false;

        Promise.all([nameUnique, shortUnique, charityExists])
        callback(errors)
    }

    function isIsoDate(str) {
        if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
        var d = new Date(str); 
        return d.toISOString()===str;
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

}