const bcrypt = require('bcrypt');

module.exports = {
    username: { type: String, required: true },
    password: { type: String, required: true, default: generatePassword() },
    lastLogin: { type: Date },
    isSuperuser: { type: Boolean, default: false },
    isStaff: { type: Boolean, default: false },
    isVolunteer: { type: Boolean, default: false },
    group: { type: Number },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    dateCreated: { type: Date, default: Date.now }
}

function generatePassword() {
    bcrypt.hash('password', 10, (err, hash) => {return hash});
}