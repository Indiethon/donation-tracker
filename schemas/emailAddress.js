module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Name is required.'],
        },
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
        host: {
            type: String,
            required: [true, 'Host is required.'],
        },
        port: {
            type: Number,
            required: [true, 'Port is required.'],
        },
        username: {
            type: String,
            required: [true, 'Username is required.'],
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    return schema;
}