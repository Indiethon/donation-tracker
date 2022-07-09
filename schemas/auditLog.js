module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        timestamp: {
            type: Date,
            default: Date.now(),
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        model: {
            type: String,
        },
        action: {
            type: String,
            enum: ['create', 'edit', 'delete']
        },
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.virtual('user', {
        ref: 'user',
        localField: 'userId',
        foreignField: '_id',
        justOne: true,
    });

    return schema;
}