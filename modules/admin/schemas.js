module.exports.user = {
    username: { type: String, required: true },
    password: { type: String, required: true },
    lastLogin: { type: Date },
    isSuperuser: { type: Boolean, required: true },
    isStaff: { type: Boolean, required: true },
    isVolunteer: { type: Boolean, required: true },
    permissions: { type: Number, required: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    dateCreated: { type: Date, required: true }
}

// email: { type: String, required: true },
//   encryptedPassword: { type: String, required: true },
//   role: { type: String, enum: ['admin', 'restricted'], required: true },