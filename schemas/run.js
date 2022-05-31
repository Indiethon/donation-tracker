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
            type: String,
            default: '',
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
        setupTime: {
            type: String,
            validate: {
                validator: function (v) {
                    return /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(v) || v === '' || v === undefined
                },
                message: () => 'Invalid setup time format.'
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
        region: {
            type: String,
            default: '',
        },
        releaseYear: {
            type: Number,
            default: null
        },
        console: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        completed: {
            type: Boolean,
            default: false,
            required: [true, 'Completed is required.']
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}