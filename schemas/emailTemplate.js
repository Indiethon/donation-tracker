module.exports.schema = (mongoose, database, localStorage) => {
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
        },
        carbonCopy: {
            type: String,
            validate: {
                validator: function (v) {
                    return v.includes('@') && v.includes('.') || v === '';
                },
                message: () => `Email is invalid.`
            },
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.post('save', async (doc) => {
        let emailTemplates = await database.models['emailTemplate'].find();
        localStorage.setItem('emailTemplate', JSON.stringify(emailTemplates));
    })
    return schema;
}