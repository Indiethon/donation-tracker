const fs = require('fs')
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt-nodejs');
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./cache');

const charity = require('./../../schemas/charity')
const event = require('./../../schemas/event')
const user = require('./../../schemas/user')
const donation = require('./../../schemas/donation')
const donor = require('./../../schemas/donor')
const prize = require('./../../schemas/prize')
const run = require('./../../schemas/run')
const runner = require('./../../schemas/runner')
const incentive = require('./../../schemas/incentive')
const ad = require('./../../schemas/ad')
const group = require('./../../schemas/group')
const wordFilter = require('./../../schemas/wordFilter')
const auditLog = require('./../../schemas/auditLog')
const emailAddress = require('./../../schemas/emailAddress')
const emailTemplate = require('./../../schemas/emailTemplate')
const prizeRedemption = require('./../../schemas/prizeRedemption')

class Database {
    constructor(tracker, url) {
        this.rootURL = url;
        this.database = {};
        this.models = {};
        this.cache = [];
        console.debug('[Database] Setting up Mongoose...')
        mongoose.Promise = global.Promise;
        console.debug('[Database] Connecting to database...')
        this.database = mongoose.connect(`${url}`, (err) => {
            if (err) { console.error('Could not connect to database. Are you sure you entered the correct URL in the config?'); return; }
            console.info(`Connected to database at ${url}.`)
        });
        mongoose.connection.on("disconnected", () => console.error('Disconnected from database. Please check your internet connection.'))
        mongoose.plugin(uniqueValidator, { message: '{PATH} is already in use.' })
        console.debug('[Database] Configuring Mongoose models...')
        this.models['charity'] = mongoose.model('charity', charity.schema(mongoose, this, localStorage))
        this.models['event'] = mongoose.model('event', event.schema(mongoose, this, localStorage))
        this.models['user'] = mongoose.model('user', user.schema(mongoose, this, localStorage))
        this.models['donation'] = mongoose.model('donation', donation.schema(mongoose, this, localStorage))
        this.models['donor'] = mongoose.model('donor', donor.schema(mongoose, this, localStorage))
        this.models['prize'] = mongoose.model('prize', prize.schema(mongoose, this, localStorage))
        this.models['run'] = mongoose.model('run', run.schema(mongoose, this, localStorage))
        this.models['runner'] = mongoose.model('runner', runner.schema(mongoose, this, localStorage))
        this.models['incentive'] = mongoose.model('incentive', incentive.schema(mongoose, this, localStorage))
        this.models['ad'] = mongoose.model('ad', ad.schema(mongoose, this, localStorage))
        this.models['group'] = mongoose.model('group', group)
        this.models['wordFilter'] = mongoose.model('wordFilter', wordFilter)
        this.models['auditLog'] = mongoose.model('auditLog', auditLog.schema(mongoose, this, localStorage))
        this.models['emailAddress'] = mongoose.model('emailAddress', emailAddress.schema(mongoose, this, localStorage))
        this.models['emailTemplate'] = mongoose.model('emailTemplate', emailTemplate.schema(mongoose, this, localStorage))
        this.models['prizeRedemption'] = mongoose.model('prizeRedemption', prizeRedemption.schema(mongoose, this, localStorage))

        console.debug('[Database] Checking database users...')
        this.models['user'].findOne({ username: 'admin' }, (err, data) => {
            if (!data) {
                console.warn("Created default user account. Please change it's password after logging in!")
                console.warn("Username: admin")
                console.warn("Password: password")
                let user = {
                    username: 'admin',
                    password: bcrypt.hashSync('password', bcrypt.genSaltSync(10)),
                    admin: true,
                    superuser: true,
                    volunteer: true,
                    groupId: null,
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

        //this.models['incentive'].on('change', data => localStorage.setItem('incentive', JSON.stringify(data)));

        console.debug('[Database] Database set up complete!')
        //mongoose.set('debug', true);
    }

    createObjectId(id) {
        return mongoose.Types.ObjectId(id);
    }

    create(model, properties) {
        return new Promise(async (resolve, reject) => {
            this.models[model].create(properties, (err, data) => {
                if (err) return resolve([true, err])
                this.cacheModel(model);
                resolve([false, data]);
            })
        })
    }

    update(model, query, properties) {
        return new Promise(async (resolve, reject) => {
            let data = await this.models[model].findOne(query);
            for (const [key, value] of Object.entries(properties)) {
                data[key] = value;
            }
            data.save((err, savedData) => {
                if (err) return resolve([true, err]);
                this.cacheModel(model);
                resolve([false, savedData]);
            })
        })
    }

    find(model, query, populateQuery) {
        return new Promise(async (resolve, reject) => {
            if (this.cache.includes(model)) {
                try {
                    let rawData = await JSON.parse(localStorage.getItem(model));
                    let data = rawData.filter(findQuery(query))
                    if (populateQuery && data && data.length > 0) resolve(await this.populate(model, data, populateQuery));
                    else resolve(data);
                    return;
                } catch (e) { console.error(e.code); console.error(e) };
            }
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            let data = JSON.parse(JSON.stringify(await this.models[model].find(query).lean()));
            if (populateQuery && data && data.length > 0) resolve(await this.populate(model, data, populateQuery));
            else resolve(data);
            this.cacheModel(model);
            return;
        })
    }

    findOne(model, query, populateQuery) {
        return new Promise(async (resolve, reject) => {
            if (this.cache.includes(model)) {
                try {
                    let rawData = await JSON.parse(localStorage.getItem(model));
                    let data = rawData.find(findQuery(query))
                    if (populateQuery && data) {
                        let arrayData = await this.populate(model, data, populateQuery);
                        resolve(arrayData[0])
                    }
                    else resolve(data);
                    return;
                } catch (e) { console.error(e.code); console.error(e) };
            }
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            let data = JSON.parse(JSON.stringify(await this.models[model].findOne(query).lean()));
            if (populateQuery && data && data.length > 0) resolve(await this.populate(model, data, populateQuery));
            else resolve(data);
            this.cacheModel(model);
            return;
        })
    }

    findAll(model, populateQuery) {
        return new Promise(async (resolve, reject) => {
            if (this.cache.includes(model)) {
                try {
                    let data = await JSON.parse(localStorage.getItem(model));
                    if (populateQuery && data && data.length > 0) resolve(await this.populate(model, data, populateQuery));
                    else resolve(data);
                    return;
                } catch (e) { console.error(e.code); console.error(e) };
            }
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            let data = JSON.parse(JSON.stringify(await this.models[model].find({}).lean()));
            if (populateQuery && data && data.length > 0) resolve(await this.populate(model, data, populateQuery));
            else resolve(data);
            this.cacheModel(model);
            return;
        })
    }

    deleteOne(model, id) {
        return new Promise(async (resolve, reject) => {
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            let deleteStatus = await this.models[model].deleteOne({ _id: id });
            this.cacheModel(model);
            resolve(deleteStatus)
        })
    }

    deleteMany(model, id) {
        return new Promise(async (resolve, reject) => {
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            id.forEach(deleteId => {
                this.models[model].deleteOne({ _id: deleteId });
            })
            this.cacheModel(model);
            resolve(deleteStatus)
        })

    }

    deleteAll(model) {
        return new Promise(async (resolve, reject) => {
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            resolve(await this.models[model].deleteMany({})
            )
        })
    }

    cacheModel(model) {
        return new Promise(async (resolve, reject) => {
            const data = await this.models[model].find({}).lean();
            localStorage.setItem(model, JSON.stringify(data));
            this.cache.push(model)
            resolve();
        })
    }

    setCache(name, data) {
        return new Promise((resolve, reject) => {
            localStorage.setItem(name, JSON.stringify(data));
            this.cache.push(name);
            resolve();
        })
    }

    getCache(name) {
        return new Promise((resolve, reject) => {
            resolve(JSON.parse(localStorage.getItem(name)))
        })
    }

    getStats(model, document) {
        return new Promise(async (resolve, reject) => {
            if (!this.models[model]) return reject({ code: 404, error: 'The requested resource could not be found on this server.' })
            if (!document) return reject({ code: 400, error: 'A document must be specified to obtain stats.' })
            resolve(await eval(model).getStats(this, document));
        })
    }

    populate(model, data, query) {
        return new Promise(async (resolve, reject) => {

            for (let k = 0; k < query.length; k++) {
                let refModel = eval(model).populate.find(x => x.ref === query[k]);
                if (!refModel) continue;
                let refData = await this.findAll(refModel.ref);
                if (!data.length) {
                    let tempArray = [];
                    tempArray.push(data);
                    data = tempArray;
                }
                for (let i = 0; i < data.length; i++) {
                    if (refModel.array) {
                        for (let j = 0; j < data[i][refModel.localField].length; j++) {
                            data[i][refModel.localField][j] = refData.find(x => {
                                let field = x[refModel.foreignField];
                                let localField = data[i][refModel.localField][j];
                                return field === localField
                            })
                        }
                    }
                    else if (refModel.subArray) {
                        console.log(data[i][refModel.localField].length)
                        for (let j = 0; j < data[i][refModel.localField].length; j++) {
                            data[i][refModel.localField][j][refModel.arrayField] = refData.find(x => {
                                let field = x[refModel.foreignField];
                                let localField = data[i][refModel.localField][j][refModel.arrayField];
                                return field === localField
                            })
                        }
                    }
                    else {
                        data[i][refModel.ref] = refData.find(x => {
                            let field = x[refModel.foreignField];
                            let localField = data[i][refModel.localField];
                            return field === localField
                        })
                    }
                }
                if (k >= query.length - 1) resolve(data);
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

function findQuery(query) {
    let queryArray = [];
    const keys = Object.keys(query);
    keys.forEach(key => {
        if (typeof query[key] === 'boolean') queryArray.push(`${(key) ? '' : "!"}x.${key}`);
        else queryArray.push(`x.${key} === "${query[key]}"`);
    })
    return new Function('x', `return ${queryArray.join(' && ')}`)
}

module.exports = Database;