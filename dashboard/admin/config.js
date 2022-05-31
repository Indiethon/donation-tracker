module.exports.tablePage = () => {
    return {
        name: 'Events',
        type: 'events',
        breadcrumb: [
            'Home',
            'Events'
        ],
    }
}

module.exports.table = (page, data) => {
    switch (page) {
        case 'events': return {
            endpoint: 'events',
            table: [{
                name: 'Name',
                data: 'name',
            }, {
                name: 'Short',
                data: 'short'
            }, {
                name: 'Charity',
                data: 'charity'
            }, {
                name: 'Target',
                data: 'target'
            }, {
                name: 'Start Time',
                textFunction: (eventData) => {
                    return new Date(eventData.startTime).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', seconds: undefined })
                }
            }, {
                name: 'End Time',
                textFunction: (eventData) => {
                    return new Date(eventData.endTime).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', seconds: undefined })
                }
            }, {
                name: 'Visible',
                data: 'visible'
            }, {
                name: 'Active',
                data: 'active'
            }]
        }; break;
    }
}