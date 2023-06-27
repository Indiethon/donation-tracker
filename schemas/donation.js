module.exports.schema = (mongoose, database, localStorage) => {
    let incentiveSchema = mongoose.Schema({
        incentiveId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'incentive',
            required: [true, 'Incentive id is required.'],
        },
        option: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'incentive.options',
        },
        amount: {
            type: Number,
            required: [true, 'Incentive amount is required.'],
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event is required.']
        },
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donor',
            required: [true, 'Donor is required.']
        },
        alias: {
            type: String,
            required: [true, 'Alias is required.'],
            maxLength: [32, 'Alias is too long.'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required.'],
        },
        comment: {
            type: String,
            maxLength: [5000, 'Comment is too long.'],
        },
        incentives: [incentiveSchema],
        custom: [{
            customId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'event.customFields',
                // required: [true, 'Custom id is required.'],
            },
            value: {}
        }],
        timestamp: {
            type: Date,
            default: Date.now
        },
        paypalStatus: {
            type: String,
        },
        completed: {
            type: Boolean,
            default: false,
            required: [true, 'Completed is required.']
        },
        verified: {
            type: Boolean,
            default: false,
            required: [true, 'Verified is required.']
        },
        visible: {
            type: Boolean,
            default: false,
            required: [true, 'Visible is required.']
        },
        read: {
            type: Boolean,
            default: false,
            required: [true, 'Read is required.']
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    incentiveSchema.virtual('incentive', {
        ref: 'incentive',
        localField: 'incentiveId',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('event', {
        ref: 'event',
        localField: 'eventId',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('donor', {
        ref: 'donor',
        localField: 'donorId',
        foreignField: '_id',
        justOne: true,
    });

    schema.post('save', async (doc) => {
        let donations = await database.models['donation'].find();
        localStorage.setItem('donation', JSON.stringify(donations));
    })
    return schema;
}

module.exports.populate = [{
    ref: 'incentive',
    localField: 'incentives',
    arrayField: 'incentiveId',
    foreignField: '_id',
    subArray: true,
}, {
    ref: 'event',
    localField: 'eventId',
    foreignField: '_id',
}, {
    ref: 'donor',
    localField: 'donorId',
    foreignField: '_id',
}]