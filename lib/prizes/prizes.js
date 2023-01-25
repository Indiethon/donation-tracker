const mongoose = require('mongoose');
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.drawPrizes = async (req) => {

    // {
    //     "event": "63c030c171e311e47bf85f4a",
    //     "entryType": "single",
    //     "prizes": [
    //         "63cdb928163acd190b0f3034",
    //         "63cede15e2c609239b0e4b75"
    //     ],
    //     "additionalEntrants": {
    //         "629a2c6d040777e4565fbb1b": [
    //             "63cdb928163acd190b0f3034",
    //             "63cede15e2c609239b0e4b75"
    //         ]
    //     }
    // }

    let errorMessage = '';
    let error = false;
    let donors = {};
    let winners = {};
    let donations = await database.models['donation'].find({ eventId: req.body.event, verified: true });

    donations.forEach(donation => {
        let idString = donation.donorId.toString();
        if (req.body.entryType === 'single' && (donors[idString] === undefined || donors[idString][0] < donation.amount)) donors[idString] = [donation.amount];
        else if (req.body.entryType === 'multi' && donors[idString] !== undefined) donors[idString].push(donation.amount);
        else if (req.body.entryType === 'multi') donors[idString] = [donation.amount];
    });

    console.log(donors)

    // prizes.forEach(async prize => {
    //     await pickWinner(prize);
    // })

    // if (errorMessage === '') errorMessage = 'Successfully drew prize winners.';

    // return [error, errorMessage];

    function pickWinner(prize) {
        return new Promise(async (resolve, reject) => {
            let eligibleDonors = [];
            Object.keys(donors).forEach(key => {
                if (donors[key] >= prize.minDonation) eligibleDonors.push(key);
            })

            for (let i = 0; i < tracker.config.prizes.maxDrawAttempts; i++) {
                let winnerNum = eligibleDonors[Math.floor(Math.random() * eligibleDonors.length)];
                if (!Object.values(winners).includes(winnerNum)) {
                    winners[prize._id.toString()] = winnerNum;
                    prize.winners.push(winnerNum);
                    prize.active = false;
                    prize.drawn = true;
                    prize.save();
                    break;
                }
                else if (i >= tracker.config.prizes.maxDrawAttempts - 1) {
                    error = true;
                    errorMessage = errorMessage + `Failed to draw winner for prize ${prize.name} (ID: ${prize.id}) \n   - Maximum prize draw attempts reached.\n\n`
                }
            }
            resolve();
        })
    }
}

module.exports.resetDrawnPrizes = async (event) => {
    let prizes = await database.models['prize'].find({ eventId: event, drawn: true });
    prizes.forEach(prize => {
        prize.drawn = false;
        prize.winners = [];
        prize.save();
    })
}