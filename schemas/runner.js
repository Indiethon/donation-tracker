module.exports = {
    name: { type: String, required: true },
    email: { type: String },
    pronouns: { type: String },
    twitch: { type: String },
    twitter: { type: String },
    youtube: { type: String },
    notes: { type: String },
    events: { type: Array },
    runs: { type: Array }
}