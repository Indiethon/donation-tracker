module.exports = {
    word: {
        type: String,
        required: [true, 'Word is required.'],
        unique: true,
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    allowed: {
        type: Boolean,
        default: false,
    }
}