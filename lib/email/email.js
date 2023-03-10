const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const crypto = require('crypto')
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.verifyEmail = async (body) => {
    return new Promise(async (resolve, reject) => {

        const transporter = nodemailer.createTransport({
            host: body.host,
            port: body.port,
            auth: {
                user: body.username,
                pass: body.password
            }
        });

        transporter.verify(function (error, success) {
            if (error) {
                resolve([true, error]);
            } else {
                resolve([false])
            }
        });
    });
}

module.exports.sendPrizeEmails = async (req, res) => {
    let errorMessage = '';
    let error = false;
    //     0|TrackerDev  | [21:38:46] [log]  {
    //     0|TrackerDev  |   emailAddress: '63cf5271bcfed79d5f8eb217',
    //     0|TrackerDev  |   emailTemplate: '63d1d96483f34df77c37eb44',
    //     0|TrackerDev  |   claimEmailTemplate: '63d1d96483f34df77c37eb44',
    //     0|TrackerDev  |   expiryTime: '2023-01-30T00:00',
    //     0|TrackerDev  |   type: 'initial',
    //     0|TrackerDev  |   prizes: [ '63d02aa24b07f8c32baa2d23', '63d1959ee7dcc14ad1dc18d3' ],
    //     0|TrackerDev  |   event: '63cdb871163acd190b0f2feb'
    //     0|TrackerDev  | }
    switch (true) {
        case (req.body.type === 'initial'): sendInitialEmails(); break;
        case (req.body.type === 'expire'): sendExpiryEmails(true); break;
        default: sendUpdateEmails(false); break;
    }

    async function sendInitialEmails() {

        let prizes = await database.models['prize'].find({ _id: { $in: req.body.prizes } }).populate('winners');
        let event = await database.models['event'].findOne({ _id: req.body.event }).populate('charity');
        let emailAddress = await database.models['emailAddress'].findOne({ _id: req.body.emailAddress });
        let emailTemplate = await database.models['emailTemplate'].findOne({ _id: req.body.emailTemplate });
        let emailTimestamp = new Date();
        let emailCount = 0;
        const transporter = nodemailer.createTransport({
            host: emailAddress.host,
            port: emailAddress.port,
            auth: {
                user: emailAddress.username,
                pass: emailAddress.password
            }
        });

        transporter.verify(function (error, success) {
            if (error) {
                res.status(500).send({ message: 'Unable to send out prize emails.\n - Unable to authenticate with the SMTP email server. Please check your credentials and try again.' })
                return;
            }
        });

        const iv = randomString();

        prizes.forEach(async prize => {

            await database.models['prizeRedemption'].updateMany({ prizeId: prize._id, status: "pending" }, { status: "expired" })

            prize.winners.forEach(async (winner, index) => {
                let donor = await database.models['donor'].findOne({ _id: winner })

                if (req.body.expired) {
                    let prizeRedemptionSearch = await database.models['prizeRedemption'].findOne({ eventId: req.body.event, prizeId: prize._id, $or: [{ status: 'claimed' }, { status: 'pending'} ]})
                    if (prizeRedemptionSearch) return;
                }

                if (!donor.email || !donor.email.includes('@') || !donor.email.includes('.')) {
                    error = true;
                    errorMessage = errorMessage + `Failed to email winner(s) for prize ${prize.name} (ID: ${prize.id}) \n   - Winner ${donor.alias[0]} (ID: ${donor._id}) does not have a valid email address.\n\n`
                    return;
                }

                let prizeRedemption = {
                    eventId: mongoose.Types.ObjectId(req.body.event),
                    prizeId: prize._id,
                    donorId: donor._id,
                    status: 'pending',
                    emailTimestamp: emailTimestamp,
                    claimEmailAddress: emailAddress._id,
                }

                if (req.body.digitalClaimEmailTemplate && prize.type === "digital") prizeRedemption.claimEmailTemplate = mongoose.Types.ObjectId(req.body.digitalClaimEmailTemplate);
                else if (req.body.physicalClaimEmailTemplate && prize.type === "physical") prizeRedemption.claimEmailTemplate = mongoose.Types.ObjectId(req.body.physicalClaimEmailTemplate);
                if (req.body.expiryTime) prizeRedemption.expiryTimestamp = new Date(req.body.expiryTime);

                let prizeRedemptionSave = await database.models['prizeRedemption'].create(prizeRedemption);

                let emailText = emailTemplate.content;
                let textToEncrypt = `${donor._id}/${prize._id}/${prizeRedemptionSave._id}`;

                const cipher = crypto.createCipheriv('aes-256-cbc', tracker.config.prizes.prizeLinkKey, iv);
                let encryptedText = cipher.update(textToEncrypt, 'utf8', 'hex');
                encryptedText += cipher.final('hex');
                encryptedText = iv + encryptedText;

                let claimURL = `${tracker.config.baseURL}/prize/claim?data=${encryptedText}`;
                let forfeitURL = `${tracker.config.baseURL}/prize/forfeit?data=${encryptedText}`;

                emailText = emailText.replaceAll('${claimURL}', claimURL)
                emailText = emailText.replaceAll('${forfeitURL}', forfeitURL)
                emailText = emailText.replaceAll('${prizeName}', prize.name)
                emailText = emailText.replaceAll('${prizeDescription}', prize.description)
                emailText = emailText.replaceAll('${prizeType}', prize.type.toUpperCase)
                emailText = emailText.replaceAll('${prizeMinDonation}', prize.minDonation)
                emailText = emailText.replaceAll('${prizeValue}', prize.value)
                emailText = emailText.replaceAll('${prizeImage}', prize.image)
                emailText = emailText.replaceAll('${prizeAltImage}', prize.altImage)
                emailText = emailText.replaceAll('${prizeContributor}', prize.contributor)
                emailText = emailText.replaceAll('${prizeRedemptionCode}', prize.redemptionCode[index])
                emailText = emailText.replaceAll('${trackerName}', tracker.config.tracker.name)
                emailText = emailText.replaceAll('${trackerURL}', tracker.config.baseURL)
                emailText = emailText.replaceAll('${trackerImage}', `${tracker.config.baseURL}/content/logo`)
                emailText = emailText.replaceAll('${trackerHomepage}', tracker.config.tracker.homepage)
                emailText = emailText.replaceAll('${privacyPolicy}', tracker.config.legal.privacyPolicy)
                emailText = emailText.replaceAll('${sweepstakesRules}', tracker.config.legal.sweepstakesRules)
                emailText = emailText.replaceAll('${trackerCurrency}', currencies[tracker.config.paypal.currency])
                emailText = emailText.replaceAll('${donorAlias}', donor.alias[0])
                emailText = emailText.replaceAll('${eventName}', event.name)
                emailText = emailText.replaceAll('${charityName}', event.charity.name)
                emailText = emailText.replaceAll('${eventTargetAmount}', event.targetAmount)

                let sendObject = {
                    from: emailAddress.email,
                    to: donor.email,
                    subject: emailTemplate.subject,
                }

                if (emailTemplate.carbonCopy) sendObject.cc = emailTemplate.carbonCopy;

                switch (true) {
                    case (emailTemplate.contentType === 'text'): sendObject.text = emailText; break;
                    default: sendObject.html = emailText; break;
                }
                await transporter.sendMail(sendObject)
            })
        })

        if (errorMessage === '') errorMessage = `Successfully sent prize emails without errors.`;
        return res.status(200).send({ message: errorMessage })

    }

    function randomString() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 16) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }
}

async function sendUpdateEmails(expire) {
    let prizeRedemption = await database.models['prizeRedemption'].find({ eventId: req.body.event, status: 'pending' });
    let event = await database.models['event'].findOne({ _id: req.body.event }).populate('charity');
    let emailAddress = await database.models['emailAddress'].findOne({ _id: req.body.emailAddress });
    let emailTemplate = await database.models['emailTemplate'].findOne({ _id: req.body.emailTemplate });

    const transporter = nodemailer.createTransport({
        host: emailAddress.host,
        port: emailAddress.port,
        auth: {
            user: emailAddress.username,
            pass: emailAddress.password
        }
    });

    transporter.verify(function (error, success) {
        if (error) {
            res.status(500).send({ message: 'Unable to send out prize emails.\n - Unable to authenticate with the SMTP email server. Please check your credentials and try again.' })
            return;
        }
    });

    const iv = randomString();

    prizeRedemption.forEach(async prizeRed => {

        if (expire) {
            prizeRed.status = 'expired';
            prizeRed.save();
        }

        let donor = await database.models['donor'].findOne({ _id: prizeRed.donorId })
        let prize = await database.models['prize'].findOne({ _id: prizeRed.prizeId })

        if (!donor.email || !donor.email.includes('@') || !donor.email.includes('.')) {
            error = true;
            errorMessage = errorMessage + `Failed to email winner(s) for prize ${prize.name} (ID: ${prize.id}) \n   - Winner ${donor.alias[0]} (ID: ${donor._id}) does not have a valid email address.\n\n`
            return;
        }

        let emailText = emailTemplate.content;
        let textToEncrypt = `${donor._id}/${prize._id}`;

        const cipher = crypto.createCipheriv('aes-256-cbc', tracker.config.prizes.prizeLinkKey, iv);
        let encryptedText = cipher.update(textToEncrypt, 'utf8', 'hex');
        encryptedText += cipher.final('hex');
        encryptedText = iv + encryptedText;

        let claimURL = `${tracker.config.baseURL}/prize/claim?data=${encryptedText}`;
        let forfeitURL = `${tracker.config.baseURL}/prize/forfeit?data=${encryptedText}`;

        emailText = emailText.replaceAll('${claimURL}', claimURL)
        emailText = emailText.replaceAll('${forfeitURL}', forfeitURL)
        emailText = emailText.replaceAll('${prizeName}', prize.name)
        emailText = emailText.replaceAll('${prizeDescription}', prize.description)
        emailText = emailText.replaceAll('${prizeType}', prize.type.toUpperCase)
        emailText = emailText.replaceAll('${prizeMinDonation}', prize.minDonation)
        emailText = emailText.replaceAll('${prizeValue}', prize.value)
        emailText = emailText.replaceAll('${prizeImage}', prize.image)
        emailText = emailText.replaceAll('${prizeAltImage}', prize.altImage)
        emailText = emailText.replaceAll('${prizeContributor}', prize.contributor)
        emailText = emailText.replaceAll('${prizeRedemptionCode}', prize.redemptionCode[index])
        emailText = emailText.replaceAll('${trackerName}', tracker.config.tracker.name)
        emailText = emailText.replaceAll('${trackerURL}', tracker.config.baseURL)
        emailText = emailText.replaceAll('${trackerImage}', `${tracker.config.baseURL}/content/logo`)
        emailText = emailText.replaceAll('${trackerHomepage}', tracker.config.tracker.homepage)
        emailText = emailText.replaceAll('${privacyPolicy}', tracker.config.legal.privacyPolicy)
        emailText = emailText.replaceAll('${sweepstakesRules}', tracker.config.legal.sweepstakesRules)
        emailText = emailText.replaceAll('${trackerCurrency}', currencies[tracker.config.paypal.currency])
        emailText = emailText.replaceAll('${donorAlias}', donor.alias[0])
        emailText = emailText.replaceAll('${eventName}', event.name)
        emailText = emailText.replaceAll('${charityName}', event.charity.name)
        emailText = emailText.replaceAll('${eventTargetAmount}', event.targetAmount)

        let sendObject = {
            from: emailAddress.email,
            to: donor.email,
            subject: emailTemplate.subject,
        }

        if (emailTemplate.carbonCopy) sendObject.cc = emailTemplate.carbonCopy;

        switch (true) {
            case (emailTemplate.contentType === 'text'): sendObject.text = emailText; break;
            default: sendObject.html = emailText; break;
        }
        await transporter.sendMail(sendObject)
    })

    if (errorMessage === '') errorMessage = 'Successfully sent prize update emails without errors.';
    return res.status(200).send({ message: errorMessage })

    function randomString() {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 16) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }
}

module.exports.sendRedemptionEmail = async (prizeRedemption) => {

    let prize = await database.models['prize'].findOne({ _id: prizeRedemption.prizeId })
    let event = await database.models['event'].findOne({ _id: prizeRedemption.eventId }).populate('charity');
    let donor = await database.models['donor'].findOne({ _id: prizeRedemption.donorId })
    let winnerIndex = prize.winners.indexOf(prizeRedemption.donorId);
    let emailAddress = await database.models['emailAddress'].findOne({ _id: prizeRedemption.claimEmailAddress });
    let emailTemplate = await database.models['emailTemplate'].findOne({ _id: prizeRedemption.claimEmailTemplate })

    const transporter = nodemailer.createTransport({
        host: emailAddress.host,
        port: emailAddress.port,
        auth: {
            user: emailAddress.username,
            pass: emailAddress.password
        }
    });

    transporter.verify(function (error, success) {
        if (error) {
            console.error(`Unable to send out prize claim email to ${donor.email}. Please check the error logs below.\n` + error)
            return;
        }
    });

    let emailText = emailTemplate.content;

    let redemptionCode = prize.redemptionCode[winnerIndex];

    emailText = emailText.replaceAll('${prizeName}', prize.name)
    emailText = emailText.replaceAll('${prizeDescription}', prize.description)
    emailText = emailText.replaceAll('${prizeType}', prize.type.toUpperCase)
    emailText = emailText.replaceAll('${prizeMinDonation}', prize.minDonation)
    emailText = emailText.replaceAll('${prizeValue}', prize.value)
    emailText = emailText.replaceAll('${prizeImage}', prize.image)
    emailText = emailText.replaceAll('${prizeAltImage}', prize.altImage)
    emailText = emailText.replaceAll('${prizeContributor}', prize.contributor)
    emailText = emailText.replaceAll('${prizeRedemptionCode}', redemptionCode)
    emailText = emailText.replaceAll('${trackerName}', tracker.config.tracker.name)
    emailText = emailText.replaceAll('${trackerURL}', tracker.config.baseURL)
    emailText = emailText.replaceAll('${trackerImage}', `${tracker.config.baseURL}/content/logo`)
    emailText = emailText.replaceAll('${trackerHomepage}', tracker.config.tracker.homepage)
    emailText = emailText.replaceAll('${privacyPolicy}', tracker.config.legal.privacyPolicy)
    emailText = emailText.replaceAll('${sweepstakesRules}', tracker.config.legal.sweepstakesRules)
    emailText = emailText.replaceAll('${trackerCurrency}', currencies[tracker.config.paypal.currency])
    emailText = emailText.replaceAll('${donorAlias}', donor.alias[0])
    emailText = emailText.replaceAll('${eventName}', event.name)
    emailText = emailText.replaceAll('${charityName}', event.charity.name)
    emailText = emailText.replaceAll('${eventTargetAmount}', event.targetAmount)

    let sendObject = {
        from: emailAddress.email,
        to: donor.email,
        subject: emailTemplate.subject,
    }

    if (emailTemplate.carbonCopy) sendObject.cc = emailTemplate.carbonCopy;

    switch (true) {
        case (emailTemplate.contentType === 'text'): sendObject.text = emailText; break;
        default: sendObject.html = emailText; break;
    }
    await transporter.sendMail(sendObject)
}

module.exports.sendTestEmails = async (req, res) => {
    let email = await database.models['emailAddress'].findOne({ _id: req.body.from });
    const transporter = nodemailer.createTransport({
        host: email.host,
        port: email.port,
        auth: {
            user: email.username,
            pass: email.password
        }
    });

    // send email
    await transporter.sendMail({
        from: email.email,
        to: req.body.to,
        subject: `${tracker.config.tracker.name} Test Email`,
        text: `Hello! If you are reciving this email, the ${tracker.config.tracker.name}'s prize email system is working! Now send those prize emails!\n\nSent from the ${tracker.config.tracker.name} using Nodemailer.\nDonation Tracker made by nicnacnic\nFound an issue? Open it on GitHub! https://github.com/Indiethon/donation-tracker/issues`
    });
}

const currencies = {
    'AUD': 'A$',
    'BRL': 'R$',
    'CAD': 'CA$',
    'CNY': 'CNY',
    'CZK': 'Kč',
    'DKK': 'kr',
    'EUR': '€',
    'HKD': 'HK$',
    'HUF': 'Ft',
    'ILS': '₪',
    'JPY': '¥',
    'MYR': 'RM',
    'MXN': 'MX$',
    'TWD': 'NT$',
    'NZD': 'NZ$',
    'NOK': 'kr',
    'PHP': '₱',
    'PLN': 'zł',
    'GBP': '£',
    'RUB': '₽',
    'SGD': 'S$',
    'SEK': 'kr',
    'CHF': 'CHF',
    'THB': '฿',
    'USD': '$',
}
