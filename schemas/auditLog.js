module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        timestamp: {
            type: Date,
            default: Date.now(),
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        resourceId: {
            type: String,
        },
        action: {
            type: String,
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.virtual('event', {
        ref: 'event',
        localField: 'eventId',
        foreignField: '_id',
        justOne: true,
    });

    schema.virtual('user', {
        ref: 'user',
        localField: 'userId',
        foreignField: '_id',
        justOne: true,
    });

    return schema;
}