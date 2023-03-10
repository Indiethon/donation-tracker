const mongoose = require('mongoose');
const crypto = require('crypto');
const email = require('../email/email')
let path = require('path');
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.drawPrizes = async (req) => {
    // Prize drawing system.

    // Create variables.
    let errorMessage = '';
    let error = false;
    let donors = {};
    let winners = {};
    let prizes = [];

    // Find all verified donations from requested event.
    let donations = await database.models['donation'].find({ eventId: req.body.event, verified: true });

    // Find all prizes requested.
    if (req.body.expired) {
        let prizeRedemption = await database.models['prizeRedemption'].find({ $or: [{ status: 'pending' }, { status: 'expired' }, { status: 'forfeited' }], $and: [{ eventId: req.body.event }] }).populate('prize')
        prizeRedemption.forEach(prizeRed => prizes.push(prizeRed.prize));
    }
    else prizes = await database.models['prize'].find({ _id: { $in: req.body.prizes } });

    // Add all donations and amounts to array.
    // Single: No matter how many donations = 1 entry
    // Multi: Each donation = 1 entry
    donations.forEach(donation => {
        let idString = donation.donorId.toString();
        if (req.body.entryType === 'single' && (donors[idString] === undefined || donors[idString][0] < donation.amount)) donors[idString] = [donation.amount];
        else if (req.body.entryType === 'multi' && donors[idString] !== undefined) donors[idString].push(donation.amount);
        else if (req.body.entryType === 'multi') donors[idString] = [donation.amount];
    });

    // Draw prizes (see function below)
    prizes.forEach(async prize => {
        await pickPrizeWinner(prize);
    })

    if (errorMessage === '') errorMessage = 'Successfully drew prize winners without errors.';

    return [error, errorMessage];

    // Prize draw function.
    function pickPrizeWinner(prize) {
        return new Promise(async (resolve, reject) => {

            // Remove all previous winenrs from prize.
            prize.winners = [];

            // Update prize redemption to remove unclaimed prizes.
            await database.models['prizeRedemption'].updateMany({ prizeId: prize._id, status: "pending" }, { status: "expired" })

            // Empty array of people eligible to win prize.
            let eligibleDonors = [];

            // Go through donor array and find all donors who's donation is equal to or above the minimum for the prize.
            Object.keys(donors).forEach(key => {
                donors[key].forEach(donation => {
                    if (donation >= prize.minDonation) eligibleDonors.push(key);
                })
            })

            // Add any additional entrants specified by the request.
            Object.keys(req.body.additionalEntrants).forEach(key => {
                if (req.body.additionalEntrants[key].includes(prize._id.toString()) && !Object.values(winners).flat().includes(req.body.additionalEntrants[key])) eligibleDonors.push(key);
            })

            // Return an error if there are not enough eligible donors to draw for the prize.
            if (eligibleDonors.length < prize.numWinners) {
                error = true;
                errorMessage = errorMessage + `Failed to draw winner(s) for prize ${prize.name} (ID: ${prize.id}) \n   - Not enough eligible donors for drawing.\n\n`
                resolve();
                return;
            }

            // Draw winners for prize (see below function)
            // Will draw multiple winners for prizes with multiple winners
            for (let i = 0; i < prize.numWinners; i++) {
                await drawWinner(i);
            }

            // Makes an attempt to draw the prize. Max attempts determined in the config (default 10).
            async function drawWinner(prizeWinner) {
                new Promise(async (drawResolve, drawReject) => {
                    for (let i = 0; i < tracker.config.prizes.maxDrawAttempts; i++) {

                        // Picks a random value in the array of eligible donors.
                        let winnerNum = eligibleDonors[Math.floor(Math.random() * eligibleDonors.length)];

                        // Checks to see if winner already won another prize.
                        // If so, another winner will be selected.
                        if (winnerNum !== undefined && !Object.values(winners).flat().includes(winnerNum)) {
                            if (winners[prize._id.toString()]) winners[prize._id.toString()].push(winnerNum);
                            else winners[prize._id.toString()] = [winnerNum];
                            prize.winners.push(winnerNum);
                            prize.active = false;
                            prize.drawn = true;

                            if (prizeWinner >= prize.numWinners - 1) await prize.save();
                            drawResolve();
                            break;
                        }

                        // If max attempts reached, throw and error.
                        else if (i >= tracker.config.prizes.maxDrawAttempts - 1) {
                            error = true;
                            errorMessage = errorMessage + `Failed to draw winner(s) for prize ${prize.name} (ID: ${prize.id}) \n   - Maximum prize draw attempts reached.\n\n`
                            drawResolve();
                            break;
                        }
                    }
                })
            }
            resolve();
            return;
        })
    }
}

module.exports.claimPrize = async (req, res) => {
    let deCipher = crypto.createDecipheriv('aes-256-cbc', tracker.config.prizes.prizeLinkKey, req.query.data.substring(0, 16));
    let decryptedData;
    try {
        decryptedData = deCipher.update(req.query.data.substring(16), "hex", 'utf-8');
        decryptedData += deCipher.final('utf8')
    } catch { return res.redirect('/prize/claim/error') }

    let idString = decryptedData.split('/');

    database.models['prizeRedemption'].findOne({ $and: [{ donorId: idString[0] }, { prizeId: idString[1] }, { _id: idString[2] }] }).exec(async (err, data) => {
        if (err) return res.redirect('/prize/claim/error')

        let expiry = new Date(data.expiryTimestamp);
        if (Date.now() > expiry) {
            data.status = 'expired';
            data.responseTimestamp = Date.now();
            data.save();
            return res.redirect('/prize/claim/error')
        }

        let prize = await database.models['prize'].findOne({ _id: idString[1] });
        let prizeArray = prize.winners.map(x => x.toString());
        if (!prizeArray.includes(idString[0]) || data.status !== 'pending') return res.redirect('/prize/claim/error')
        data.status = 'claimed';
        data.responseTimestamp = Date.now();
        data.save();
        if (data.claimEmailTemplate) email.sendRedemptionEmail(data);
        return res.redirect('/prize/claim/success')
    })
}

module.exports.forfeitPrize = async (req, res) => {
    let deCipher = crypto.createDecipheriv('aes-256-cbc', tracker.config.prizes.prizeLinkKey, req.query.data.substring(0, 16));
    let decryptedData;
    try {
        decryptedData = deCipher.update(req.query.data.substring(16), "hex", 'utf-8');
        decryptedData += deCipher.final('utf8')
    } catch { return res.redirect('/prize/forfeit/error') }

    let idString = decryptedData.split('/');

    database.models['prizeRedemption'].findOne({ $and: [{ donorId: idString[0] }, { prizeId: idString[1] }, { _id: idString[2] }] }).exec(async (err, data) => {
        if (err) return res.redirect('/prize/forfeit/error')

        let expiry = new Date(data.expiryTimestamp);
        if (Date.now() > expiry) {
            data.status = 'expired',
                data.responseTimestamp = Date.now();
            data.save();
            return res.redirect('/prize/forfeit/error')
        }

        if (data.status !== 'pending') return res.redirect('/prize/forfeit/error')

        data.status = 'forfeited';
        data.responseTimestamp = Date.now();
        data.save();
        return res.redirect('/prize/forfeit/success')
    })
}

module.exports.resetDrawnPrizes = async (event) => {
    let prizes = await database.models['prize'].find({ eventId: event, drawn: true });
    prizes.forEach(prize => {
        prize.drawn = false;
        prize.winners = [];
        prize.save();
    })
}