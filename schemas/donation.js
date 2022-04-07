module.exports = {
    event: { type: String, required: true },
    donor: { type: String, required: true },
    alias: { type: String, required: true },
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    comment: { type: String },
    incentives: { type: Object },
    custom: { type: Object },
    timestamp: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false, required: true },
    verified: { type: Boolean, default: false, required: true },
    visible: { type: Boolean, default: false, required: true },
}