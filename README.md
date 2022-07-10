Image here

# donation-tracker
An easy to use donation tracker for speedrunning marathons.

[![Release](https://img.shields.io/github/v/release/indiethon/donation-tracker?label=Release)](https://github.com/indiethon/donation-tracker/releases)
![License](https://img.shields.io/github/license/indiethon/donation-tracker?label=License)
[![Twitter](https://img.shields.io/twitter/follow/nicnacnic11?style=social)](https://twitter.com/nicnacnic11)
[![Discord](https://img.shields.io/badge/-Join%20the%20Discord!-brightgreen?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/A34Qpfe)

## About
This project is a fully fleged donation tracker built specifically for speedrunning marathons. Inspired by the GDQ tracker, this system can track and process donations, manage incentives and prizes, and more. Everything is written in pure Node.JS and is easy to install. 

### Features
- Accept and track donations through PayPal
- Set up incentives, bidwars and prizes to encourage donations
- Set up multiple events to sort your donations
- See marathon stats, such as donation total and average donation
- Fully featured API with detailed documentation
- Import runs from Oengus to your schedule
- Data stored in MongoDB database

## Requirements
- Node.JS v16 or higher
- MongoDB v4 or higher

Furthermore, your charity of choice must be part of the [Paypal Giving Fund](https://www.paypal.com/fundraiser/hub) and you must have your charity's payee email.

## Installation

To install, navigate to your desired directory and run the following commands.

- Using Git, clone the repo. `git clone https://github.com/indiethon/donation-tracker.git`
- Install all the dependencies. `npm install`
- Generate the config file. `npm run config`
- Open `config.json` and change desired settings. More information can be found in the [docs]()

## Usage

Once installed and configured, type `npm start` in the command line to start the tracker. Ensure your MongoDB instance is running before you start the tracker!

## Supporting Projects

Alongside the main project, check out these supporting projects that extend the functionality of the tracker! See their individial Github pages for installation instructions and more information.

- [nodecg-tracker-link](https://github.com/Indiethon/nodecg-tracker-link) Link the tracker with a NodeCG instance to update the schedule, and set start and end times for each run automatically!

If you'd like to add your own project to the list, please submit a pull request.

## Contributing

The latest [release](https://github.com/Indiethon/donation-tracker/releases) is where the latest stable build is located, and is recommended for production. 

If you come across a bug, please submit in the [issue tracker](https://github.com/Indiethon/donation-tracker/issues). Make sure to include your version of Node.JS, your version of MongoDB, the error that you're encountering and the steps to reproduce the error.

If you would like to help advance the project, all development is done through the `main` branch. Simply submit a pull request with your proposed changes and they will be promptly reviewed. Please make sure to **test your code** before submitting any pull requests!

## Special Thanks

Riekelt, DoubleDubbel and thedmpanda for suggestions, bug finding, and moral support while developing the tracker.

KunoDememtries and the Horror(ible) Games Staff for their willingness to test the tracker during their marathon.

## License

MIT License

Copyright (c) 2022 nicnacnic

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# OLD README BELOW
# donation-tracker
A easy to use and open source donation tracker for speedrunning marathons. Inspired by the GDQ donation tracker but runs in Node. Currently, the tracker admin dashboard is nearing completion with a volunteer dashboard starting soon. API is *almost* complete, in the phase of testing things. Progress can be tracked on our [projects page](https://github.com/Indiethon/donation-tracker/projects/1). IF you have any suggestions or bugs, please post them in the issue tracker. Thanks!

**This tracker is partially ready for production. Basic features such as donation tracking, incentives, etc... are done and working, but advanced features like prize drawings are not yet working. The tracker is still in active development.**

# Deploying
*The tracker is still under development, this is subject to change.*

5 steps to success:
- Using Git, clone the repo. `git clone https://github.com/indiethon/donation-tracker.git`
- Install all the dependencies. `npm install`
- Generate the config file. `npm run config`
- Open `config.json` and change desired settings. Make sure to save!
- Start the tracker. `npm start`

If a page can't load in the dashboard, try disabling your ad blocker.

# Simple Docs

## Passwords
When creating users or resetting their passwords, the default password is `password`. Each individual user is able to change their own password once they log in. For security reasons, a password from another user cannot be changed through the dashboard. To change another user's password, open the MongoDB database directly through a program (such as MongoDB Compass) or through the command line, find the user, delete the password field, then restart the dashboard. The affected user's password will be reset to the default once the dashboard restarts.

## API Keys
There are two ways to get API keys to access secured API routes.

#### Use a system-generated key
Every time a user logs into the dashboard, a unique key is generated to give API access to that user. That key is stored in your browser's cookies and on the server. Once the user logs out or closes their browser, this key is thrown away and can no longer be used. This is the system used for the admin and volunteer dashboards.

#### Create a custom key
In `config.json`, under `tracker`, add a string to the `tokens` array. When you make a secured API request, add this string to the bearer field in the authorization header. This key is to allow access to the API outside of the admin dashboard, such as for external applications like stream layout packages.

WARNING: Do not share this string with anyone! This will give anyone who has it full control of the dashboard!
