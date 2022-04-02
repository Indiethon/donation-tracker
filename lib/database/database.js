const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

class Database {
    constructor(url) {
        this.rootURL = url;
        this.database = {};
        this.models = {};
        mongoose.Promise = global.Promise;
        this.database = mongoose.connect(`${url}/tracker`, (err) => {
            if (err) { console.error('Could not connect to database. Are you sure you entered the correct URL in the config?'); return; }
            console.info(`Connected to database at ${url}.`)
        });
        mongoose.connection.on("disconnected", () => console.error('Disconnected from database. Please check your internet connection.'))
        this.models['event'] = mongoose.model('event', require('./../../schemas/event'))
        this.models['user'] = mongoose.model('user', require('./../../schemas/user'))
        this.models['donation'] = mongoose.model('donation', require('./../../schemas/donation'))
        this.models['donor'] = mongoose.model('donor', require('./../../schemas/donor'))
        this.models['group'] = mongoose.model('group', require('./../../schemas/group'))
        this.models['run'] = mongoose.model('run', require('./../../schemas/run'))
        this.models['runner'] = mongoose.model('runner', require('./../../schemas/runner'))
        this.models['incentive'] = mongoose.model('incentive', require('./../../schemas/incentive'))

        this.models['user'].countDocuments({}, (err, count) => {
            if (err) throw new Error('Unable to count number of users. Is there an issue with the database?')
            if (count <= 0) {
                bcrypt.hash('password', 10, (err, hash) => {
                    let user = new this.models['user']({
                        username: 'admin',
                        password: hash,
                        lastLogin: undefined,
                        isSuperuser: true,
                        isStaff: true,
                        isVolunteer: true,
                        dateCreated: undefined,
                    });
                    user.save((err) => {
                        if (err) return err;
                        return;
                    })
                });
            }
        });
    }

    save(document) {
        document.save((err) => {
            if (err) return err;
            return;
        })
    }

    find(model = String, criteria = Object, callback) {
        this.models[model].find(criteria, (err, data) => {
            if (err) return callback(true, err);
            else if (data.length <= 0) return callback(false, undefined)
            else if (data.length === 1) return callback(false, data[0])
            return callback(false, data);
        })
    }

    addDonation(event, data) {
        this.save(event, this.models[event].donation)
    }
}

module.exports = Database;