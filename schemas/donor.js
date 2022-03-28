module.exports = {
    id: { type: String, required: true },
    alias: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    address: {
        name: { type: String },
        street: { type: String },
        apt: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
        countryId: { type: Number },
    },
    paypalEmail: { type: String },
    donations: { type: Array },
}