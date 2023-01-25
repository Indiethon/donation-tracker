const nodemailer = require('nodemailer');
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.verifyEmail = async (body) => {
    return new Promise(async (resolve, reject) => {

        console.log(body)
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
    console.log(req.body)
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