module.exports = {
    name: {
        type: String,
        required: [true, 'Group name is required.'],
        unique: true
    },
    permissions: [{
        model: {
            type: String,
            enum: ['ad', 'auditLog', 'charity', 'donation', 'donor', 'drawPrizes', 'emailAddress', 'emailTemplate', 'event', 'group', 'incentive', 'prize', 'prizeRedemption', 'sendPrizeEmails', 'run', 'runner', 'user', 'wordFilter'],
            required: [true, 'Model is required.'],
        },
        level: {
            type: String,
            enum: ['none', 'access', 'read', 'modify', 'full'],
            required: [true, 'Level is required.']
        }
    }]
}