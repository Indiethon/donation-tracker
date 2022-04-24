const bcrypt = require('bcrypt')

module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        username: {
            type: String,
            unique: true,
            maxLength: [60, 'Username is too long.'],
            required: [true, 'Username is required.'],
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
            get: v => v = undefined,
        },
        lastLogin: {
            type: Date,
            default: Date.now
        },
        isSuperuser: {
            type: Boolean,
            default: false,
        },
        groupName: {
            type: String,
        },
        groupId: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        email: {
            type: String,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    return schema;
}