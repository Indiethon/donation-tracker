const blockedShorts = ['all', 'active', 'tracker', 'create', 'edit', 'view', 'delete', 'donate', 'login', 'admin', 'volunteer', 'details']

module.exports.schema = (mongoose, database, localStorage) => {
    let optionsSchema = mongoose.Schema({
        type: {
            type: String,
            enum: ['input', 'checkbox'],
            required: [true, 'Type is required.']
        },
        name: {
            type: String,
            maxLength: [60, 'Name is too long.'],
            required: [true, 'Name is required.']
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    let schema = mongoose.Schema({
        name: {
            type: String,
            unique: true,
            uniqueCaseInsensitive: true,
            maxLength: [60, 'Event name is too long.'],
            required: [true, 'Event name is required.']
        },
        short: {
            type: String,
            unique: true,
            uniqueCaseInsensitive: true,
            maxLength: [10, 'Short is too long.'],
            required: [true, 'Short is required.'],
            validate: {
                validator: function (v) {
                    if (!blockedShorts.includes(v)) return true;
                    return false;
                },
                message: () => `Short is already in use.`
            },
        },
        description: { type: String },
        charityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'charity',
            required: [true, 'Charity is required.'],
        },
        targetAmount: {
            type: Number,
            required: [true, 'Target amount is required.'],
            min: [0.01, 'Target amount must be greater than zero.'],
        },
        minDonation: {
            type: Number,
            required: [true, 'Minimum donation is required.'],
            min: [0.01, 'Minimum donation must be greater than zero.'],
            validate: {
                validator: function (v) {
                    return v < this.targetAmount;
                },
                message: () => `Minimum donation must be less that the target amount.`
            },
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required.'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required.'],
            validate: {
                validator: function (v) {
                    return this.startTime < v;
                },
                message: () => `End time must be after the start time.`
            },
        },
        prizeTime: { type: Date },
        hashtag: { type: String },
        autoScreen: {
            type: Boolean,
            default: false,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
        },
        visible: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: false,
            validate: {
                validator: async function (v) {
                    const event = await database.models['event'].findOne({ active: true });
                    if (event === null || event === undefined) return true;
                    if (v === true && event.short !== this.short) return false;
                    return true;
                },
                message: () => 'There is already an active event.'
            }
        },
        customFields: [optionsSchema]
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.virtual('charity', {
        ref: 'charity',
        localField: 'charityId',
        foreignField: '_id',
        justOne: true,
    });

    schema.method('getStats', async function (callback) {
        let stats = {};
        const donations = await database.models['donation'].find({ eventId: this.id, completed: true })
        if (donations.length <= 0) {
            stats.total = 0;
            stats.count = 0;
            stats.min = 0;
            stats.max = 0;
            stats.avg = 0;
            stats.median = 0;
            callback(stats)
            return;
        }
        let totalArray = [];
        for (const donation of donations) {
            totalArray.push(donation.amount);
        }
        stats.total = totalArray.reduce(function (a, b) { return a + b }, 0);
        stats.count = donations.length;
        stats.min = Math.min(...totalArray)
        stats.max = Math.max(...totalArray)
        stats.avg = (stats.total / totalArray.length).toFixed(2);
        totalArray = [...totalArray].sort((a, b) => a - b);
        stats.median = (totalArray[totalArray.length - 1 >> 1] + totalArray[totalArray.length >> 1]) / 2;
        callback(stats)
    });

    // schema.post('save', async (doc) => {
    //     let events = await database.models['event'].find().populate('charity');
    //     let activeEvent = await database.models['event'].findOne({ active: true }).populate('charity')
    //     let sortedEvents = events.sort((a, b) => b.startTime - a.startTime);
    //     let eventList = {};
    //     let eventDetails = {};
    //     for (const event of sortedEvents) {
    //         eventList[event.short] = event.name;
    //         eventDetails[event.short] = event;
    //     }
    //     localStorage.setItem('event', events);
    //     tracker.cache.set('eventList', eventList);
    //     tracker.cache.set('eventDetails', eventDetails);
    //     tracker.cache.set('activeEvent', activeEvent);
    // });

    schema.post('save', async (doc) => {
        let events = await database.models['event'].find();
        localStorage.setItem('event', JSON.stringify(events));
    })

    return schema;
}

module.exports.populate = [{
    ref: 'charity',
    localField: 'charityId',
    foreignField: '_id',
}]

module.exports.getStats = async (database, document) => {
    return new Promise(async (resolve, reject) => {
        let stats = {};
        const donations = await database.find('donation', { eventId: document._id, completed: true })
        if (donations.length <= 0) {
            stats.total = 0;
            stats.count = 0;
            stats.min = 0;
            stats.max = 0;
            stats.avg = 0;
            stats.median = 0;
            resolve(stats)
            return;
        }
        let totalArray = [];
        for (const donation of donations) {
            totalArray.push(donation.amount);
        }
        stats.total = totalArray.reduce(function (a, b) { return a + b }, 0);
        stats.count = donations.length;
        stats.min = Math.min(...totalArray)
        stats.max = Math.max(...totalArray)
        stats.avg = parseFloat((stats.total / totalArray.length).toFixed(2));
        totalArray = [...totalArray].sort((a, b) => a - b);
        stats.median = (totalArray[totalArray.length - 1 >> 1] + totalArray[totalArray.length >> 1]) / 2;
        resolve(stats)
    })
}