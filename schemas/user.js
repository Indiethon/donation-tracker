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
        admin: {
            type: Boolean,
            default: false,
        },
        superuser: {
            type: Boolean,
            default: false,
        },
        volunteer: {
            type: Boolean,
            default: false,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'group',
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

    schema.virtual('group', {
        ref: 'group',
        localField: 'groupId',
        foreignField: '_id',
        justOne: true,
    });

    return schema;
}