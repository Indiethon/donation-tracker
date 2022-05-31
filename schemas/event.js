const blockedShorts = ['all', 'active', 'tracker', 'create', 'edit', 'view', 'delete', 'donate', 'login', 'admin', 'volunteer']

module.exports.schema = (mongoose, database) => {
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
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true }});
    
    schema.virtual('charity', {
        ref: 'charity',
        localField: 'charityId',
        foreignField: '_id',
        justOne: true,
    });

    schema.method('getStats', async function(callback) {
        const donations = await database.models['donation'].find({ eventId: this.id, completed: true })
        let stats = {};
        let totalArray = [];
        for (const donation of donations) {
            totalArray.push(donation.amount);
        }
        stats.total = totalArray.reduce(function(a, b){ return a + b }, 0);
        stats.count = donations.length;
        stats.min = Math.min(...totalArray)
        stats.max = Math.max(...totalArray)
        stats.avg = (stats.total / totalArray.length).toFixed(2);
        totalArray = [...totalArray].sort((a, b) => a - b);
        stats.median = (totalArray[totalArray.length - 1 >> 1] + totalArray[totalArray.length >> 1]) / 2;
        callback(stats)   
      });
    return schema;
}