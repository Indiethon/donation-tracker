const bcrypt = require('bcrypt-nodejs')

module.exports.schema = (mongoose, database, localStorage) => {
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

    schema.post('save', async (doc) => {
        let users = await database.models['user'].find();
        localStorage.setItem('user', JSON.stringify(users));
    })

    return schema;
}

module.exports.populate = [{
    ref: 'group',
    localField: 'groupId',
    foreignField: '_id',
}]