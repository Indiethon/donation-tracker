module.exports.schema = (mongoose, database, localStorage) => {
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
        },
        active: {
            type: Boolean,
            default: false
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.virtual('event', {
        ref: 'event',
        localField: 'eventId',
        foreignField: '_id',
        justOne: true,
    });

    schema.post('save', async (doc) => {
        let ads = await database.models['ad'].find();
        console.log('refreshing blurb')
        localStorage.setItem('ad', JSON.stringify(ads));
    })

    return schema;
}

module.exports.populate = [{
    ref: 'event',
    localField: 'eventId',
    foreignField: '_id',
}]