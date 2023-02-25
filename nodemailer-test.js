const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: 'nicnacnicyt@gmail.com',
        pass: 'wctzevpzzjffvlra'
    }
});

let sendObject = {
    from: 'prizes@indiethon.com',
    to: 'nicnacnic@nicnacnic.com',
    subject: 'test',
    html: `
    <!DOCTYPE html>
<html>
    <body>
    <center>
        <div class="center" id="imgDiv">
        <img class="center" width="400" src="https://u.cubeupload.com/nicnacnic/INDIETHONLOGOONLY.png" alt="Indiethon logo.">
        </div>
        </center>
        <p style="font-size:13pt">
        Hello  {donorAlias},<br>
            <br>
         Congratulations! You won an  {eventName} prize!<br>
<br>
         You have won:<br>
         1x  {prizeName}<br>
<br>
         To confirm that you would like to recieve this prize, please click on the link below. You must claim your prize within 1 week before it is forfieted.
<br><br>
          {claimLink}
<br><br>
         Alternativly, if you would not like to claim this prize, please click on the following link so we know to redraw.
<br><br>
          {forfeitLink}
<br><br>
         This sweepstakes is governed by our <a href="https://google.com" target="_blank">sweepstakes rules</a>. If you have any questions or concerns about this sweepstakes, please contact the main     organizer, nicnacnic, by email at nicnacnic@indiethon.com.
<br><br>
         Thank you!<br>
         - Indiethon Team<br><br>
        </p>
        <p style="font-size:10pt; color:#696969;">This email was automatically generated. Please, do not reply.</p>
    </body>
    <style>
        body {
            width: 60%;
            height: 100%;
            overflow-x: hidden;
            text-wrap: wrap;
        }
    </style>
</html>
    `
}

transporter.sendMail(sendObject)