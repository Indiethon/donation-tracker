module.exports = {
    name: { type: String, required: true },
    description: { type: String },
    payee: { type: String, required: true },
    logoUrl: { type: String },
    stats: { 
        donors: { type: Number },
        donationTotal: { type: Number },
        minDonation: { type: Number },
        maxDonation: { type: Number },
        avgDonation: { type: Number },
    }
}