# Configuration File

The confiuration file for the tracker is named `config.json`, and is located in the root project folder. To generate a new config file, simply run `npm run config` in the main project folder.

## Sample Config 
```json
{
  "baseURL": "localhost",
  "port": 8080,
  "ssl": {
    "enabled": false,
    "keyPath": "",
    "certPath": ""
  },
  "paypal": {
    "useSandbox": false,
    "currency": "USD"
  },
  "tracker": {
    "name": "Donation Tracker",
    "databaseURL": "mongodb://localhost:27017/donation-tracker",
    "homepage": "https://google.com",
    "logoPath": "https://images.google.com",
    "passwordHash": "Some random phrase here!",
    "tokens": ["ThisIsAToken"]
  },
  "legal": {
    "privacyPolicy": "https://google.com",
    "sweepstakesRules": "https://google.com"
  },
  "frontend": {
    "useDefault": true,
    "donationSuccessMessage": "Thanks for donating! Enjoy the event!"
  }
}
```

## Schema

- `baseURL` (*String*): The base URL for the tracker. Must be a domain or subdomain.
- `port` (*Number*): The port that the tracker should listen on.
- `ssl` (*Oblect*): Object containing SSL properties.
    - `enabled` (*Boolean*): Enables or disables SSL.
    - `keyPath` (*String*): The path to an SSL key file.
    - `certPath` (*String*): The path to an SSL certificate file.
- `paypal` (*Object*): Object containing PayPal properties.
    - `useSandbox` (*Boolean*): Enables or disables the use of PayPal sandbox.
    - `currency` (*String*): Specifies the currency of the tracker. Must be a [PayPal supported currency](https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/).
- `tracker` (*Object*): Object containing tracker properties.
    - `name` (*String*): Name of the tracker. Appears on the frontend as well as in page titles.
    - `databaseURL` (*String*): The URL to the assosiated MongoDB database. 
    - `homepage` (*String*): The URL to your marathon website or homepage.
    - `logoPath` (*String*): The path to a image file for the tracker logo.
    - `passwordHash` (*String*): The key that is used to hash passwords. Can be anything.
    - `tokens` (*String Array*): An array of strings for tokens to access the API.
- `legal` (*Object*): Object containing legal properties.
    - `privacyPolicy` (*String*): The URL to your marathon's privacy policy.
    - `sweepstakesRules` (*String*): The URL to your marathon's sweepstakes rules.
- `frontend` (*Object*): Object containing frontend properties.
    - `useDefault` (*Boolean*): Enable or disable the default frontend that comes with the tracker.
    - `donationSuccessMessage` (*String*): The message shown to users after a successful donation.

## Additional Notes

- If using SSL, the port should always be 443.
- Although a privacy policy and sweepstakes rules are highly recommended, this is not legal advice. Use your own judgement. 
- The Paypal sandbox simulates a real payment system, without actually withdrawing any funds from your account. This is useful for testing, but should not be used in production.
