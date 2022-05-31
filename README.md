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
