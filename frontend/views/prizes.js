export default class {
    constructor(event) {

        this.events = {
            async getHeader() {
                return `<div class="pageTitle">Prizes</div>`
            },

            async getPreMain() {
                return `<div class="sweepstakesRules">No donation necessary for a chance to win. See <a
                class="sweepstakesRulesLink link" href="${details.sweepstakesRules}" target="_blank">sweepstakes rules</a> for details and instructions.</div>`
            },

            table: {
                name: 'prize',
                model: 'prizes',
                endpoint: `prizes/event/${event}`,
                event: event,
                table: [{
                    name: 'Name',
                    data: 'name',
                }, {
                    name: 'Contributor',
                    data: 'contributor'
                }, {
                    name: 'Minimum Donation',
                    textFunction: (value, details) => {
                        return `${details.currencySymbol}${value.minDonation.toFixed(2)}`;
                    }
                }, {
                    name: 'Start Time',
                    textFunction: (value) => {
                        return new Date(value.startTime).toLocaleString([], {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            seconds: undefined
                        })
                    }
                }, {
                    name: 'End Time',
                    textFunction: (value) => {
                        return new Date(value.endTime).toLocaleString([], {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            seconds: undefined
                        })
                    }
                }, {
                    name: 'Type',
                    textFunction: (value) => {
                        return value.type.charAt(0).toUpperCase() + value.type.slice(1);
                    }
                }, {
                    name: 'Winners',
                    textFunction: (value) => {
                        let donorList = [];
                        for (const donor of value.winners) {
                            donorList.push(donor.alias[0])
                        }
                        return donorList.join(', ');
                    }
                }],
                // clickFunction: (value) => {
                //     return `location.href = '/prizes/${event}/${value.id}'`
                // },
                rowFunction: (prize) => {
                    return prize.visible
                },
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