module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event id is required.'],
        },
        game: {
            type: String,
            required: [true, 'Game is required.'],
        },
        category: {
            type: String,
            required: [true, 'Category is required.'],
        },
        runners: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'runner',
            required: [true, 'At least 1 runner is required.'],
        }],
        multiplayer: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required.'],
        },
        estimate: {
            type: String,
            required: [true, 'Estimate is required.'],
            validate: {
                validator: function (v) {
                    return /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(v)
                },
                message: () => `Invalid estimate format.`
            },
        },
        finalTime: {
            type: String,
            validate: {
                validator: function (v) {
                    return /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(v) || v === '' || v === undefined
                },
                message: () => 'Invalid final time format.'
            },
        },
        finalSetupTime: {
            type: String,
            validate: {
                validator: function (v) {
                    return /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(v) || v === '' || v === undefined
                },
                message: () => 'Invalid final setup time format.'
            },
        },
        releaseYear: {
            type: Number
        },
        console: {
            type: String
        },
        notes: {
            type: String
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}