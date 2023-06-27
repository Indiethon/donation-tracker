module.exports.schema = (mongoose, database, localStorage) => {    
    let schema = mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Charity name is required.'],
            unique: true,
        },
        description: {
            type: String
        },
        payee: {
            type: String,
            required: [true, 'Payee is required.'],
        },
        logoUrl: {
            type: String
        }
    }, { toJSON: { virtuals: true } }, { toObject: { virtuals: true } });

    schema.method('getStats', async function (callback) {
        let stats = {};
        let totalArray = [];
        const events = await database.models['event'].find({ charityId: this.id });
        for (const event of events) {
            const donations = await database.models['donation'].find({ eventId: event.id, completed: true })
            for (const donation of donations) {
                totalArray.push(donation.amount);
            }
        }
        stats.total = totalArray.reduce(function (a, b) { return a + b }, 0);
        stats.min = Math.min(...totalArray)
        stats.max = Math.max(...totalArray)
        stats.avg = stats.total / totalArray.length;
        totalArray = [...totalArray].sort((a, b) => a - b);
        stats.median = (totalArray[totalArray.length - 1 >> 1] + totalArray[totalArray.length >> 1]) / 2;
        callback(stats)
    });

    schema.post('save', async (doc) => {
        let charities = await database.models['charity'].find();
        localStorage.setItem('charity', JSON.stringify(charities));
    })

    return schema;
}

module.exports.getStats = async (database, document) => {
    return new Promise(async (resolve, reject) => {
        let stats = {};
        let totalArray = [];
        const events = await database.find('event', { charityId: document._id });
        for (const event of events) {
            const donations = await database.find('donation', { eventId: event._id, completed: true })
            for (const donation of donations) {
                totalArray.push(donation.amount);
            }
        }
        stats.total = totalArray.reduce(function (a, b) { return a + b }, 0);
        stats.min = Math.min(...totalArray)
        stats.max = Math.max(...totalArray)
        stats.avg = stats.total / totalArray.length;
        totalArray = [...totalArray].sort((a, b) => a - b);
        stats.median = (totalArray[totalArray.length - 1 >> 1] + totalArray[totalArray.length >> 1]) / 2;
        resolve(stats);
    })
}