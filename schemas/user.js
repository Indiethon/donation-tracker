module.exports = {
    username: { type: String, required: true },
    password: { type: String, required: true },
    lastLogin: { type: Date, default: Date.now },
    isSuperuser: { type: Boolean, default: false },
    isStaff: { type: Boolean, default: false },
    isVolunteer: { type: Boolean, default: false },
    group: { type: Number },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    dateCreated: { type: Date, default: Date.now, required: true }
}