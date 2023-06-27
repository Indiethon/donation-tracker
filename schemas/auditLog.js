module.exports.schema = (mongoose, database, localStorage) => {
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
        modelName: {
            type: String
        },
        action: {
            type: String,
            enum: ['create', 'edit', 'delete']
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });
    
    schema.virtual('user', {
        ref: 'user',
        localField: 'userId',
        foreignField: '_id',
        justOne: true,
    });

    schema.post('save', async (doc) => {
        let auditLogs = await database.models['auditLog'].find();
        localStorage.setItem('auditLog', JSON.stringify(auditLogs));
    })

    return schema;
}

module.exports.populate = [{
    ref: 'user',
    localField: 'userId',
    foreignField: '_id',
}]