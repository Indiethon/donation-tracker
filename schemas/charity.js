module.exports = {
    name: { 
        type: String,
        required: [true, 'Charity name is required.'],
        unique: true,
    },
    description: {
        type: String
    },
    payee: {
        type: String,
        required: [true, 'Payee is required.'],
    },
    logoUrl: {
        type: String
    }
}