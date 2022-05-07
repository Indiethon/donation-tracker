module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event is required.']
        },
        name: {
            type: String,
            required: [true, 'Ad name is required.'],
        },
        text: {
            type: String
        },
        notes: {
            type: String,
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.virtual('event', {
        ref: 'event',
        localField: 'eventId',
        foreignField: '_id',
        justOne: true,
    });

    return schema;
}