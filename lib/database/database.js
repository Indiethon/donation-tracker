const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

class Database {
    constructor(url) {
        this.rootURL = url;
        this.database = {};
        this.models = {};
        mongoose.Promise = global.Promise;
        this.database['tracker'] = mongoose.createConnection(`${url}/tracker`, (err) => {
            if (err) { console.error('Could not connect to database. Are you sure you entered the correct URL in the config?'); return; }
            console.info(`Connected to database at ${url}.`)
        });
        mongoose.connection.on("disconnected", () => console.error('Disconnected from database. Please check your internet connection.'))
        this.models['tracker'] = {};
        this.models['tracker']['event'] = this.database['tracker'].model('event', require('./../../schemas/event'))
        this.models['tracker']['user'] = this.database['tracker'].model('user', require('./../../schemas/user'))

        this.models['tracker']['user'].countDocuments({}, (err, count) => {
            if (err) throw new Error('Unable to count number of users. Is there an issue with the database?')
            if (count <= 0) {
                bcrypt.hash('password', 10, (err, hash) => {
                    let user = new this.models['tracker']['user']({
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

    connect(database) {
        console.log(`${this.rootURL}/${database}`)
        this.database[database] = mongoose.createConnection(`${this.rootURL}/${database}`);
    }

    model(database, name, schema) {
        this.models[database][name] = this.database[database].model(name, schema)
    }

    save(database, model, data) {
        this.database[database][this.models[model]].save((err) => {
            if (err) return err;
            return;
        })
    }

    find(database, model, criteria, callback) {
        this.models[database][model].find(criteria, (err, data) => {
            if (err) return callback(true, err);
            else if (data.length <= 0) return callback(true, 'No data found matching the specified criteria.')
            return callback(false, data);
        })
    }

    createEvent(event = {}) {
        this.connect(event.name);
        this.save('tracker', this.models.event, event)
        this.model(event.name, 'donations', require('./../../schemas/donation'))
        this.model(event.name, 'incentives', require('./../../schemas/incentive'))
        this.model(event.name, 'runs', require('./../../schemas/run'))
        //this.model(event.name, 'prizes', require('./../../schemas/prizes'))
    }

    addDonation(event, data) {
        this.save(event, this.models[event].donation)
    }
}

module.exports = Database;