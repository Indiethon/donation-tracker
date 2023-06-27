module.exports.schema = (mongoose, database, localStorage) => {
    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event id is required.'],
        },
        prizeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'prize',
            required: [true, 'Prize id is required.'],
        },
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donor',
            required: [true, 'Donor id is required.'],
        },
        claimEmailTemplate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'emailTemplate',
        },
        claimEmailAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'emailAddress',
        },
        status: {
            type: String,
            required: [true, 'Status is required.'],
            enum: ['pending', 'claimed', 'forfeited', 'expired']
        },
        emailTimestamp: {
            type: Date,
            required: [true, 'Email timestamp is required.'],
        },
        responseTimestamp: {
            type: Date,
        },
        expiryTimestamp: {
            type: Date,
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    schema.virtual('event', {
        ref: 'event',
        localField: 'eventId',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('prize', {
        ref: 'prize',
        localField: 'prizeId',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('donor', {
        ref: 'donor',
        localField: 'donorId',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('emailTemplate', {
        ref: 'emailTemplate',
        localField: 'claimEmailTemplate',
        foreignField: '_id',
        justOne: true,
    });
    schema.virtual('emailAddress', {
        ref: 'emailAddress',
        localField: 'claimEmailAddress',
        foreignField: '_id',
        justOne: true,
    });

    schema.post('save', async (doc) => {
        let prizeRedemptions = await database.models['prizeRedemption'].find();
        localStorage.setItem('prizeRedemption', JSON.stringify(prizeRedemptions));
    })

    return schema;
}

module.exports.populate = [{
    ref: 'event',
    localField: 'eventId',
    foreignField: '_id',
}, {
    ref: 'prize',
    localField: 'prizeId',
    foreignField: '_id',
}, {
    ref: 'donor',
    localField: 'donorId',
    foreignField: '_id',
}, {
    ref: 'emailTemplate',
    localField: 'claimEmailTemplate',
    foreignField: '_id',
}, {
    ref: 'emailAddress',
    localField: 'claimEmailAddress',
    foreignField: '_id',
}]