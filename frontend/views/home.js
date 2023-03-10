export default class {
    constructor(event, details) {

        this.events = {
            async getHeader() {
                return `<div class="pageTitle">Home</div>`
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