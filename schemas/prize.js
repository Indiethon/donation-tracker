const blockedShorts = ['all', 'active', 'tracker', 'create', 'edit', 'view', 'delete']

module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event id is required.'],
        },
        name: {
            type: String,
            maxLength: [60, 'Prize name is too long.'],
            required: [true, 'Prize name is required.']
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ['physical', 'digital'],
            required: [true, 'Prize type is required.']
        },
        minDonation: {
            type: Number,
            required: [true, 'Minimum donation is required.'],
        },
        numWinners: {
            type: Number,
            required: [true, 'Number of winners is required.'],
            min: [1, 'Number of winners is required.'],
        },
        value: {
            type: Number,
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
        image: {
            type: String,
        },
        altImage: {
            type: String,
        },
        contributor: {
            type: String,
        },
        winners: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donor',
            required: [true, 'At least 1 donor is required.'],
        }],
        redemptionCode: [{
            type: String,
        }],
        visible: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: false,
        },
        drawn: {
            type: Boolean,
            default: false,
            validate: {
                validator: function (v) {
                    if (v && this.active) return false;
                    return true;
                },
                message: () => 'A drawn prize cannot be activated.'
            }
        },
        notes: {
            type: String,
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true }});

    return schema;
}