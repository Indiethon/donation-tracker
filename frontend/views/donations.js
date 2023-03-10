export default class {
    constructor(event, details) {

        this.events = {
            async getHeader() {
                return `<div class="pageTitle">Donations</div>`
            },

            async getPreMain() {
                return `<div class="donationStats"></div>`
            },

            table: {
                name: 'donation',
                model: 'donations',
                endpoint: `donations/event/${event}`,
                event: event,
                table: [{
                    name: 'Alias',
                    data: 'alias',
                }, {
                    name: 'Time Received',
                    textFunction: (value) => {
                        return new Date(value.timestamp).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', seconds: undefined })
                    }
                }, {
                    name: 'Amount',
                    textFunction: (value, details) => {
                        return `${details.currencySymbol}${value.amount.toFixed(2)}`;
                    }
                }, {
                    name: 'Comment',
                    textFunction: (value) => {
                        if (value.comment.length > 0) return 'Yes';
                        return 'No';
                    }
                }],
                rowFunction: (value) => {
                    if (value.completed && value.verified && value.visible) return true;
                    return false;
                },
                // clickFunction: (value) => {
                //     return `location.href = '/donations?id=${value.id}'`
                // }
            },

            async getFooter(tz) {
                return `<div class="timezoneText">All times converted to your local timezone. Detected timezone: ${tz}</div>
                    <div>Donation tracker made by nicnacnic</div>
                    <div>Found an issue? Open it on <a class="link" href="https://github.com/Indiethon/donation-tracker">GitHub</a>!
                    </div>`
            },

            async runFunction() {
                let eventData = await GET(`events/stats/${event}`);
                console.log('event Data')
                console.log(eventData);
                let div = document.querySelector('.donationStats');

                try {
                    div.innerHTML = `<b>Total (Count):</b> ${details.currencySymbol}${eventData.data.total} (${eventData.data.count}) - <b>Max/Avg/Median Donation:</b> ${details.currencySymbol}${eventData.data.max} / ${details.currencySymbol}${eventData.data.avg} / ${details.currencySymbol}${eventData.data.median}`
                } catch { }
                return;
            }
        }
    }
}
