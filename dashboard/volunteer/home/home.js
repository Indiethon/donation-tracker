async function generateHomeTable(options) {

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

                    tbody.append(row);
                }
            }
            resolve(tbody);
        })
    }
}