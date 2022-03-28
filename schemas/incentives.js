module.exports = {
    id: { type: String, required: true },
    run: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true },
    options: { type: Array },
    allowUserOptions: { type: Boolean, required: true },
    userOptionMaxLength: { type: Number },
    startTime: { type: Date },
    endTime: { type: Date },
    goal: { type: Number, required: true },
    currentAmount: { type: Number },
    notes: { type: String },
}