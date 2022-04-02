module.exports = {
    name: { type: String, required: true },
    payee: { type: String, required: true },
    description: { type: String },
    logoUrl: { type: String },
    incentives: { type: Object },
    custom: { type: Object },
    timestamp: { type: Date, default: Date.now },
    verified: { type: Boolean, required: true, default: false },
    visible: { type: Boolean, required: true, default: false },
}