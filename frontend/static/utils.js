let short = new URLSearchParams(window.location.search).get('event');

// let details;


async function loadPage() {
    // let res = await fetch('/api/details', { method: 'GET' });
    // details = await res.json();

    // let dropdown = document.querySelector('.eventDropdownContent');
    // for (const event of Object.keys(details.eventList)) {
    //     dropdown.innerHTML += ` <div class="eventDropdownButton" event="${event}" onClick="changeEvent(this)">${details.eventList[event]}</div>`
    // }
    if (window.location.pathname.includes('/donate')) {
        document.querySelector('.eventDropdownText').innerHTML = details.eventList[details.activeEvent.short];
        short = details.activeEvent.short
    }
    else document.querySelector('.eventDropdownText').innerHTML = (short) ? details.eventList[short] : 'All Events';
}

function changeEvent(button) {
    short = button.getAttribute('event');
    document.querySelector('.eventDropdownText').innerHTML = (short) ? details.eventList[short] : 'All Events';
    changePath(short);
}

async function generateTable(options) {

    // Return if page is all.
    if (!short) return;

    // Create table.
    let table = document.createElement('table');
    table.setAttribute('class', 'table');

    // Get data from API
    let data = await GET(options.endpoint);

    console.log(data)

    // Generate table rows.
    table.append(await createHeader());
    table.append(await createBody());

    // Append to page.
    let div = document.createElement('div')
    div.append(table)
    document.querySelector('main').append(div);

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
                    if (options.clickFunction) row.setAttribute('onClick', options.clickFunction(element));

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

async function apiError(error, body) {
    console.error('Error while making API request.\n\n', `Status:`, error.status, `\nStatus Text:`, body, `\nRequested Endpoint:`, error.url, `\n\nIf this issue persists, please open an issue in the Github repository https://github.com/Indiethon/donation-tracker/issues`);
}

