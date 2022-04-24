module.exports.schema = (mongoose, database) => {
    let optionsSchema = mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Incentive name is required.'],
        },
        userOption: {
            type: Boolean,
            default: false,
        },
        total: {
            type: Number,
            required: [true, 'Total is required.']
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    
    let schema = mongoose.Schema({
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'event',
            required: [true, 'Event id is required.'],
        },
        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'run',
            required: [true, 'Run id is required.'],
        },
        name: {
            type: String,
            required: [true, 'Name is required.'],
        },
        description: {
            type: String
        },
        type: {
            type: String,
            enum : ['target','bidwar'],
            required: [true, 'Incentive type is required.']
        },
        goal: {
            type: Number,
            validate: {
                validator: function (v) {
                    if (this.type === 'bidwar') return true;
                    else if (v !== undefined) return true;
                    return false;
                },
                message: () => `Goal is required.`
            },
        },
        total: {
            type: Number,
            default: 0,
            required: [true, 'Total is required.']
        },
        options: [optionsSchema],
        allowUserOptions: {
            type: Boolean,
            required: [true, 'Allow user options is required.']
        },
        userOptionMaxLength: {
            type: Number
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
        visible: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: false,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    schema.virtual('run', {
        ref: 'run',
        localField: 'runId',
        foreignField: '_id',
        justOne: true,
    });
    return schema;
}