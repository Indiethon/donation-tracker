module.exports = {
    name: { type: String, required: true },
    short: { type: String, required: true },
    description: { type: String },
    charityId: { type: String, required: true },
    charityName: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    minDonation: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    prizeTime: { type: Date },
    hashtag: { type: String },
    autoScreen: { type: Boolean, required: true },
    dateCreated: { type: Date, default: Date.now },
    visible: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    customFields: { type: Array }
}