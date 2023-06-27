module.exports.schema = (mongoose, database, localStorage) => {
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
        donations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'donation',
        }]
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.post('save', async (doc) => {
        let donors = await database.models['donor'].find();
        localStorage.setItem('donor', JSON.stringify(donors));
    })
    return schema;
}