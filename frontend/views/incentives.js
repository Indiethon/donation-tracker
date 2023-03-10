export default class {
    constructor(event) {

        this.events = {
            async getHeader() {
                return `<div class="pageTitle">Incentives</div>`
            },

            table: {
                name: 'incentive',
                model: 'incentives',
                endpoint: `incentives/event/${event}`,
                event: event,
                table: [{
                    name: 'Name',
                    textFunction: (value) => {
                        if (value.type === 'target') return value.name;
                        return `${value.name}<br>
                        <button class="tableOptionsButton" incentiveid=${value._id} onClick="showOptionsSubtable(this)">Show Options</button>
                    `
                    }
                }, {
                    name: 'Run',
                    textFunction: (value) => { return value.run.game; }
                }, {
                    name: 'Description',
                    data: 'description'
                }, {
                    name: 'Total',
                    textFunction: (value, details) => {
                        return `${details.currencySymbol}${value.total.toFixed(2)}`
                    }
                }, {
                    name: 'Goal',
                    textFunction: (value, details) => {
                        if (value.type === 'bidwar') return '(None)';
                        return `${details.currencySymbol}${value.goal.toFixed(2)}`
                    }
                }],
                // clickFunction: (value) => {
                //     return `location.href = '/incentives/${event}/${value.id}'`
                // },
                subTableData: 'options',
                subTableFunction: (value) => {
                    if (value.type === 'bidwar') return true;
                    return false;
                },
                subTable: [{
                    name: 'Option',
                    data: 'name',
                }, {
                    name: 'Amount',
                    textFunction: (value, details) => {
                        return `${details.currencySymbol}${value.total.toFixed(2)}`
                    }
                }, {
                    name: 'User Option',
                    textFunction: (value) => {
                        if (value.userOption) return 'Yes';
                        return 'No';
                    }
                }],
                rowFunction: (incentive) => {
                    return incentive.visible
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