module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Runner name is required.'],
            unique: true,
        },
        email: {
            type: String,
            default: '',
            validate: {
                validator: function (v) {
                    return (v.includes('@') && v.includes('.')) || v === undefined || v === '';
                },
                message: () => `Email is invalid.`
            },
        },
        pronouns: {
            type: String,
            default: '',
        },
        twitch: {
            type: String,
            default: '',
        },
        twitter: {
            type: String,
            default: '',
        },
        youtube: {
            type: String,
            default: '',
        },
        discord: {
            type: String,
            default: '',
            validate: {
                validator: function (v) {
                    return v.includes('#') || v === undefined || v === '';
                },
                message: () => `Discord username must have tag. Example: username#1234.`
            },
        },
        src: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        runs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'run',
        }]
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}