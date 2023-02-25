export default class {
    constructor(event) {

        this.events = {
            async getHeader() {
                return `<div class="pageTitle">Runs</div>`
            },

            table: {
                name: 'run',
                model: 'runs',
                endpoint: `speedruns/event/${event}`,
                event: event,
                table: [{
                    name: 'Game',
                    data: 'game',
                }, {
                    name: 'Category',
                    data: 'category',
                }, {
                    name: 'Players',
                    textFunction: (value) => {
                        let runnerList = [];
                        for (const runner of value.runners) {
                            runnerList.push(runner.name)
                        }
                        return runnerList.join(', ');
                    }
                }, {
                    name: 'Start Time',
                    textFunction: (value) => {
                        if (value.actualStartTime) return new Date(value.actualStartTime).toLocaleString([], {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            seconds: undefined
                        })
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
                    name: 'Estimate',
                    data: 'estimate',
                }, {
                    name: 'Final Time',
                    textFunction: (value) => {

                        if (value.finalTime && value.finalTime.length > 0) return value.finalTime;
                        return '';
                    }
                }],
                // clickFunction: (value) => {
                //     return `location.href = '/runs/${value.id}'`
                // },
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