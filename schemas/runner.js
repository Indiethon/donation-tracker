module.exports = {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    pronouns: { type: String },
    twitch: { type: String },
    twitter: { type: String },
    youtube: { type: String },
    notes: { type: String },
    runs: { type: Array }
}