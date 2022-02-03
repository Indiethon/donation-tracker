const express = require('express');
const bodyParser = require('body-parser')
const path = require('path')
const config = require('./config.json')
// const paypal = require('@paypal/checkout-server-sdk');
const Paypal = require('paypal-nvp-api')
const fetch = require('node-fetch');
const ipn = require('paypal-ipn-checker')
//const paypal = require('paypal-rest-sdk')

const app = express();

let jsonParse = bodyParser.json();
// Basic Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/donate/ipn', (req, res) => {
    res.send(200)
});

app.post('/donate/ipn', jsonParse, (req, res) => {
    console.log(req.body)
    res.sendStatus(200);
    ipn.verify(res.body, {'allow_sandbox': true}, function callback(err, mes) {
        if (err) {
            console.error(err);
          } else {
            console.log('sucsess')
         
            if (params.payment_status == 'Completed') {
              // Payment has been confirmed as completed
            }
          }
      });


    // res.status(200)
    // res.end();
    // let body = 'cmd=_notify-validate&' + res.body;
    // // var postreq = 'cmd=_notify-validate';
    // // for (var key in req.body) {
    // //     if (req.body.hasOwnProperty(key)) {
    // //         var value = querystring.escape(req.body[key]);
    // //         postreq = postreq + "&" + key + "=" + value;
    // //     }
    // // }
    // fetch('https://ipnpb.sandbox.paypal.com/cgi-bin/webscr', {
    //     method: 'POST',
    //     headers: {
    //         'Connection': 'close'
    //     },
    //     body: body,
    //     strictSSL: true,
    //     rejectUnauthorized: false,
    //     requestCert: true,
    //     agent: false
    // }).then((data) => {
    //     if (JSON.stringify(data.body).substring(0, 8) === 'VERIFIED') {
    //         console.log('sucsess')
    //     }
    //     else console.log('fail')
    // }).catch((error) => {
    //     console.log(error)
    // })

    // // STEP 1: read POST data
    // req.body = req.body || {};
    // res.status(200).send('OK');
    // res.end();

    // // read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
    // var postreq = 'cmd=_notify-validate';
    // for (var key in req.body) {
    // 	if (req.body.hasOwnProperty(key)) {
    // 		var value = querystring.escape(req.body[key]);
    // 		postreq = postreq + "&" + key + "=" + value;
    // 	}
    // }

    // // Step 2: POST IPN data back to PayPal to validate
    // console.log('Posting back to paypal'.bold);
    // console.log(postreq);
    // console.log('\n\n');
    // var options = {
    // 	url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
    // 	method: 'POST',
    // 	headers: {
    // 		'Connection': 'close'
    // 	},
    // 	body: postreq,
    // 	strictSSL: true,
    // 	rejectUnauthorized: false,
    // 	requestCert: true,
    // 	agent: false
    // };

    // request(options, function callback(error, response, body) {
    // 	if (!error && response.statusCode === 200) {

    // 		// inspect IPN validation result and act accordingly
    // 		if (body.substring(0, 8) === 'VERIFIED') {
    // 			// The IPN is verified, process it
    // 			console.log('Verified IPN!'.green);
    // 			console.log('\n\n');

    // 			// assign posted variables to local variables
    // 			var item_name = req.body['item_name'];
    // 			var item_number = req.body['item_number'];
    // 			var payment_status = req.body['payment_status'];
    // 			var payment_amount = req.body['mc_gross'];
    // 			var payment_currency = req.body['mc_currency'];
    // 			var txn_id = req.body['txn_id'];
    // 			var receiver_email = req.body['receiver_email'];
    // 			var payer_email = req.body['payer_email'];

    // 			//Lets check a variable
    // 			console.log("Checking variable".bold);
    // 			console.log("payment_status:", payment_status)
    // 			console.log('\n\n');

    // 			// IPN message values depend upon the type of notification sent.
    // 			// To loop through the &_POST array and print the NV pairs to the screen:
    // 			console.log('Printing all key-value pairs...'.bold)
    // 			for (var key in req.body) {
    // 				if (req.body.hasOwnProperty(key)) {
    // 					var value = req.body[key];
    // 					console.log(key + "=" + value);
    // 				}
    // 			}

    // 		} else if (body.substring(0, 7) === 'INVALID') {
    // 			// IPN invalid, log for manual investigation
    // 			console.log('Invalid IPN!'.error);
    // 			console.log('\n\n');
    // 		}
    // 	}
    // });
});

// app.post("/pay", (req, res) => {
// const create_payment_json = {
//     "intent": "sale",
//     "payer": {
//         "payment_method": "paypal"

//     },
//     "redirect_urls": {
//       // you will need to replace localhost with your server url
//         "return_url": "http://localhost/success",
//         "cancel_url": "http://localhost/cancel"
//     },
//     "transactions": [{
//         "item_list": {
//             "items": [{
//                 "name": "Donation",
//                 "sku": "001",
//                 "price": "2.00",
//                 "currency": "USD",
//                 "quantity": 1
//             }]
//         },
//         "amount": {
//             "currency": "USD",
//             "total": "2.00"
//         },
//         'payee':{
//             'email': 'annualgiving@fredhutch.org'
//         },
//         "description": "Supporting open source programming."
//     }]
// };

// paypal.payment.create(create_payment_json, function (error, payment) {
//     if (error) {
//         throw error;
//     } else {
//         for(let i = 0; i < payment.links.length; i++){
//           if(payment.links[i].rel === 'approval_url'){
//             res.redirect(payment.links[i].href);
// }
// }
//     }
// });

// });



// app.get('/success', (req, res) => {
//   const payerID = req.query.PayerID;
//   const paymentID = req.query.paymentId;

//   const execute_payment_json = {
//     "payer_id": payerID,
//     "transactions": [{
//        "amount": {
//           "currency": "USD",
//           "total": "2.00"
// }
// }]
// };

//   paypal.payment.execute(paymentID, execute_payment_json, function (error, payment) {
//     if (error) {
//       console.log(error.response);
//       throw error;
// } else {
//     console.log("Get Payment Response");
//     console.log(JSON.stringify(payment));
//     res.render('success');
// }

// });
// });


// app.get('/cancel', (req, res) => res.render('cancel'));

// Web Server

app.get('*', (req, res) => res.status(404).send('Page not found.'));

app.listen(3000, () => console.log(`Listening at port 3000`));