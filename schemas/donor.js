module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        alias: [{
            type: String,
            required: [true, 'Alias is required.'],
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
                type: String
            },
            street: {
                type: String
            },
            apt: {
                type: String
            },
            city: {
                type: String
            },
            state: {
                type: String
            },
            postalCode: {
                type: String
            },
            country: {
                type: String
            },
        },
        paypalEmail: {
            type: String
        },
        donations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donation',
        }]
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}