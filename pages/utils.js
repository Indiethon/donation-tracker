let details;

async function pageLoaded() {
    let eventShort = window.location.pathname.split('/')[2];
    if (eventShort !== undefined && eventShort !== 'success' && eventShort !== 'error') details = await GET(`details/${eventShort}`)
    else {
        details = await GET('details');
        eventShort = details.data.eventShort;
    }
    if (details.data.eventName === undefined) details.data.eventName = 'All Events'
    document.querySelector('title').innerHTML += ` - ${details.data.eventName}`;
    try { document.querySelector('.sweepstakesRulesLink').href = details.data.sweepstakesRules } catch { }
    document.querySelector('.eventDropdownText').innerHTML = details.data.eventName;
    const navButtons = document.querySelectorAll('.topNavButton');
    for (const button of navButtons) {
        button.setAttribute('event', eventShort)
    }
    try { document.querySelector('.pageTitle').innerHTML += ` - ${details.data.eventName}` } catch { };
    document.querySelector('.topNavImg').setAttribute('onClick', `location.href = '${details.data.homepage}'`);
    try { document.querySelector('.timezoneText').innerHTML += new window.Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { };
    try { document.querySelector('.successMessage').innerHTML = details.data.donationSuccessMessage } catch {}
    if (details.data.activeEvent) { try { document.querySelector('.topNavDonate').style.display = 'inline-block' } catch {}}
    generateEventDropdown()
    try { loadData() } catch {};
}

async function generateEventDropdown() {
    const eventList = await GET('events/list');
    let dropdown = document.querySelector('.eventDropdownContent');
    for (const event of Object.keys(eventList.data)) {
        dropdown.innerHTML += `
        <div class="eventDropdownButton" event="${event}" onClick="changeEvent(this)">${eventList.data[event]}</div>
        `
    }
    document.querySelector('body').style.display = 'inherit';
}
async function generateTable(options) {

    // Return if page is all.
    if (window.location.pathname.split('/')[2] === 'all' || window.location.pathname.split('/')[2] === undefined) return;

    // Wait for details to be defined.
    await new Promise(async (resolve, reject) => {
        let interval = setInterval(() => {
            if (details !== undefined && details.data !== undefined) {
                clearInterval(interval);
                return resolve();
            }
        }, 10);
    });

    // Create table.
    let table = document.createElement('table');
    table.setAttribute('class', 'table');

    // Get data from API
    let data = await GET(options.endpoint);

    // Generate table rows.
    table.append(await createHeader());
    table.append(await createBody());

    // Append to page.
    document.querySelector('.content').append(table);

    // Show content when generation is complete.
    //showContent();

    // Helper functions.
    async function createHeader() {
        let thead = document.createElement('thead');
        let tr = document.createElement('tr');
        return new Promise((resolve, reject) => {
            for (const option of options.table) {
                let header = document.createElement('th');
                header.innerHTML = option.name;
                tr.append(header);
            }
            thead.append(tr);
            resolve(thead);
        })
    }

    async function createBody() {
        let tbody = document.createElement('tbody');
        return new Promise(async (resolve, reject) => {
            for (const element of data.data) {
                let create = (options.rowFunction !== undefined) ? await options.rowFunction(element) : true;
                if (create) {
                    let row = document.createElement('tr');
                    for (const option of options.table) {
                        if (option.textFunction !== undefined) row.insertCell().innerHTML = option.textFunction(element, details);
                        else row.insertCell().innerHTML = element[option.data];
                    }

                    // Temporarily disabled until the page is made!
                    //row.setAttribute('onClick', options.clickFunction(element));

                    // Create sub table.
                    tbody.append(row);

                    if (options.subTable !== undefined && options.subTableFunction(element)) {
                        let subTableRow = document.createElement('tr');
                        subTableRow.classList.add('subTableRow');
                        subTableRow.setAttribute('dataid', element._id);
                        let cell = subTableRow.insertCell();
                        cell.setAttribute('colSpan', 6)
                        cell.append(await generateSubTable(options.subTable, element[options.subTableData]));
                        
                        let invisibleRow = document.createElement('tr');
                        invisibleRow.style.display = 'none';
                        
                        tbody.append(subTableRow);
                        tbody.append(invisibleRow);
                    }
                }
            }
            resolve(tbody);
        })
    }
}

async function generateSubTable(options, tableData) {
    return new Promise(async (resolve, reject) => {
        let table = document.createElement('table');
        let thead = document.createElement('thead');
        let tbody = document.createElement('tbody');
        let tr = document.createElement('tr');
        await new Promise((resolve, reject) => {
            for (const option of options) {
                let header = document.createElement('th');
                header.innerHTML = option.name;
                tr.append(header);
            }
            thead.append(tr);
            table.append(thead);
            resolve();
        })

        await new Promise(async (resolve, reject) => {
            for (const element of tableData) {
                let row = document.createElement('tr');
                for (const option of options) {
                    if (option.textFunction !== undefined) row.insertCell().innerHTML = option.textFunction(element, details);
                    else row.insertCell().innerHTML = element[option.data];
                }
                tbody.append(row);
            }
            table.append(tbody);
            resolve();
        })

        resolve(table);
    });
}

function showOptionsSubtable(button) {
    let subtables = document.querySelectorAll('.subTableRow');
    for (let subtable of subtables) {
        if (subtable.getAttribute('dataid') === button.getAttribute('incentiveid')) {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                button.innerHTML = 'Show Options';
                subtable.style.display = 'none';
            }
            else {
                button.classList.add('active');
                button.innerHTML = 'Hide Options';
                subtable.style.display = 'table-row';
            }
        }
        else {
            let button = document.querySelector(`.tableOptionsButton[incentiveid='${subtable.getAttribute('dataid')}']`)
            button.classList.remove('active');
            button.innerHTML = 'Show Options'
            subtable.style.display = 'none';
        }
    }
}

async function GET(endpoint) {
    let headers = { 'Content-Type': 'application/json' };
    let response = await fetch(`${window.location.origin}/api/${endpoint}`, { method: 'GET', headers: headers });
    let data = await response.json();
    switch (response.status) {
        case 200: return { error: false, status: response.status, data: data }; break;
        default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
    }
}

// async function POST(endpoint, body) {
//     let headers = { 'Content-Type': 'application/json' };
//     let response = await fetch(`${window.location.origin}/api/${endpoint}`, { method: 'POST', headers: headers, body: JSON.stringify(body) });
//     let data = await response.json();
//     switch (response.status) {
//         case 200: return { error: false, status: response.status, data: data }; break;
//         default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
//     }
// }

// async function PUT(endpoint, body) {
//     let headers = { 'Content-Type': 'application/json' };
//     let response = await fetch(`${window.location.origin}/api/${endpoint}`, { method: 'PUT', headers: headers, body: JSON.stringify(body) });
//     let data = await response.json();
//     switch (response.status) {
//         case 200: return { error: false, status: response.status, data: data }; break;
//         default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
//     }
// }

// async function DELETE(endpoint, body) {
//     let headers = { 'Content-Type': 'application/json' };
//     let response = await fetch(`${window.location.origin}/api/${endpoint}`, { method: 'DELETE', headers: headers, body: JSON.stringify(body) });
//     let data = await response.json();
//     switch (response.status) {
//         case 200: return { error: false, status: response.status, data: data }; break;
//         default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
//     }
// }

async function apiError(error, body) {
    console.error('Error while making API request.\n\n', `Status:`, error.status, `\nStatus Text:`, body, `\nRequested Endpoint:`, error.url, `\n\nIf this issue persists, please open an issue in the Github repository https://github.com/Indiethon/donation-tracker/issues`);
}

function switchPage(button) {
    location.href = `${button.getAttribute('page')}/${button.getAttribute('event')}`
}

function changeEvent(button) {
    location.href = `/${window.location.pathname.split('/')[1]}/${button.getAttribute('event')}`
}