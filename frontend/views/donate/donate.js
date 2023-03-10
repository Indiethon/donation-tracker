export default class {
    constructor(event) {

        this.stylesheets = [
            '/content/static/donate/donate.css'
        ]

        this.scripts = [
            '/content/static/donate/donate.js'
        ]

        this.waitForScript = true;

        this.events = {
            async getHeader() {
                return `
                <div class="pageTitle">Donate</div>
                <div class="pageSubtitle"></div>    
                <span class="inputUnitTest" style="visibility: hidden"></span>
                `
            },

            async getPreMain() {
                let res = await fetch('/content/static/donate/donate.html');
                let html = await res.text();
                return html;
            },

            async getFooter(tz) {
                return `<div class="timezoneText">All times converted to your local timezone. Detected timezone: ${tz}</div>
                    <div>Donation tracker made by nicnacnic</div>
                    <div>Found an issue? Open it on <a class="link" href="https://github.com/Indiethon/donation-tracker">GitHub</a>!
                    </div>`
            }
        }
    }
}