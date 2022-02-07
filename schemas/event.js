module.exports = {
    name: { type: String, required: true },
    short: { type: String, required: true },
    receiverName: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    payeeEmail: { type: String, required: true },
    charityLogo: { type: String, default: "" },
    currency: { type: String, required: true },
    timezone: { type: String, required: true },
    minimumDonation: { type: Number, required: true },
    hashtag: { type: String },
    dateCreated: { type: Date, default: Date.now }
}