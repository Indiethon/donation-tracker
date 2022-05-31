module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        alias: [{
            type: String,
            required: [true, 'Alias is required.'],
            maxLength: [32, 'Alias is too long.'],
        }],
        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            validate: {
                validator: function (v) {
                    return v.includes('@') && v.includes('.');
                },
                message: () => `Email is invalid.`
            },
        },
        firstName: {
            type: String,
            default: '',
        },
        lastName: {
            type: String,
            default: '',
        },
        address: {
            name: {
                type: String,
                default: '',
            },
            street: {
                type: String,
                default: '',
            },
            apt: {
                type: String,
                default: '',
            },
            city: {
                type: String,
                default: '',
            },
            state: {
                type: String,
                default: '',
            },
            postalCode: {
                type: String,
                default: '',
            },
            country: {
                type: String,
                default: '',
            },
        },
        paypalEmail: {
            type: String,
            default: '',
        },
        donations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donation',
        }]
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}