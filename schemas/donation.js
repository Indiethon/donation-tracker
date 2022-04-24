module.exports.schema = (mongoose, database) => {
    // let incentiveSchema = mongoose.Schema({
        
    // }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

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
            required: [true, 'Alias is required.']
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required.'],
            validate: {
                validator: async function (v) {
                    const event = await database.models['event'].findOne({ _id: this.eventId });
                    if (v < event.minDonation) return false;
                    return true;
                },
                message: 'Amount is under the minimum donation.'
            }
        },
        comment: {
            type: String
        },
        incentives: [{
            id: {
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
        }],
        custom: [],
        timestamp: {
            type: Date,
            default: Date.now
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
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
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
    return schema;
}