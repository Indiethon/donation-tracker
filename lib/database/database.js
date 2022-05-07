const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
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
        mongoose.plugin(uniqueValidator, { message: '{PATH} is already in use.' })
        this.models['charity'] = mongoose.model('charity', require('./../../schemas/charity').schema(mongoose, this))
        this.models['event'] = mongoose.model('event', require('./../../schemas/event').schema(mongoose, this))
        this.models['user'] = mongoose.model('user', require('./../../schemas/user').schema(mongoose, this))
        this.models['donation'] = mongoose.model('donation', require('./../../schemas/donation').schema(mongoose, this))
        this.models['donor'] = mongoose.model('donor', require('./../../schemas/donor').schema(mongoose, this))
        this.models['prize'] = mongoose.model('prize', require('./../../schemas/prize').schema(mongoose, this))
        this.models['group'] = mongoose.model('group', require('./../../schemas/group'))
        this.models['run'] = mongoose.model('run', require('./../../schemas/run').schema(mongoose, this))
        this.models['runner'] = mongoose.model('runner', require('./../../schemas/runner').schema(mongoose, this))
        this.models['incentive'] = mongoose.model('incentive', require('./../../schemas/incentive').schema(mongoose, this))
        this.models['ad'] = mongoose.model('ad', require('./../../schemas/ad').schema(mongoose, this))
        this.models['wordFilter'] = mongoose.model('wordFilter', require('./../../schemas/wordFilter'))

        global._mongoose = 'test';
        this.models['user'].countDocuments({}, (err, count) => {
            if (err) throw new Error('Unable to count number of users. Is there an issue with the database?')
            if (count <= 0) {
                console.warn("Created default user account. Please change it's password after logging in!")
                console.warn("Username: admin")
                console.warn("Password: password")
                let user = {
                    username: 'admin',
                    password: bcrypt.hashSync('password', 10),
                    superuser: true,
                    firstName: '',
                    lastName: '',
                    email: '',
                };
                this.models['user'].create(user, (err, data) => {
                    if (err) return console.error(data);
                    return;
                });
            }
        });

        this.models['user'].find({}).exec((err, data) => {
            for (const user of data) {
                const password = user.get('password', null, { getters: false });
                if (password === undefined || password === null) {
                    user.password = bcrypt.hashSync('password', 10);
                    user.save();
                    console.warn(`Password reset for user ${user.username}. Please use the default password when logging in!`)
                }
            }
        })
    }

    // create(model, data, callback) {
    //     this.models[model].create(data, (err, document) => {
    //         if (err) return callback(true, err);
    //         return callback(false, document)
    //     });
    // }

    // save(document) {
    //     document.save((err) => {
    //         if (err) return err;
    //         return;
    //     })
    // }

    // delete(model, data, callback) {
    //     this.models[model].deleteOne(data, (err) => {
    //         if (err) return callback(true)
    //         return callback(false)
    //     })
    // }

    // find(model, criteria, callback) {
    //     this.models[model].find(criteria, (err, data) => {
    //         if (err) return callback(true, err);
    //         else if (data.length <= 0) return callback(false, undefined)
    //         callback(false, data[0])
    //     })
    // }

    // findAll(model, criteria, callback) {
    //     this.models[model].find(criteria, (err, data) => {
    //         if (err) return callback(true, err);
    //         else if (data.length <= 0) return callback(false, undefined)
    //         return callback(false, data);
    //     })
    // }

    // getActiveEvent(callback) {
    //     this.models['event'].find({ active: true }, (err, data) => {
    //         if (err) return callback(true, err);
    //         else if (data.length > 0) return callback(false, data[0])
    //         else return callback(false, undefined);
    //     })
    // }

    // addDonation(event, data) {
    //     this.save(event, this.models[event].donation)
    // }
}

module.exports = Database;