module.exports.schema = (mongoose, database) => {
    let schema = mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Name is required.'],
        },
        subject: {
            type: String,
            required: [true, 'Subject is required.'],
        },
        content: {
            type: String,
            required: [true, 'Host is required.'],
        },
        contentType: {
            type: String,
            required: [true, 'Content type is required.'],
            enum: ['text', 'html']
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    return schema;
}