// async function generateHomeTable(options) {

//     // Create table.
//     let table = document.createElement('table');
//     table.setAttribute('class', 'table');

//     // Get data from API
//     let data = await GET(options.endpoint);

//     // Generate table rows.
//     table.append(await createHeader());
//     table.append(await createBody());

//     // Append to page.
//     document.querySelector('.content').append(table);

//     // Show content when generation is complete.
//     //showContent();

//     // Helper functions.
//     async function createHeader() {
//         let thead = document.createElement('thead');
//         let tr = document.createElement('tr');
//         return new Promise((resolve, reject) => {
//             for (const option of options.table) {
//                 let header = document.createElement('th');
//                 header.innerHTML = option.name;
//                 tr.append(header);
//             }
//             thead.append(tr);
//             resolve(thead);
//         })
//     }

//     async function createBody() {
//         let tbody = document.createElement('tbody');
//         return new Promise(async (resolve, reject) => {
//             for (const element of data.data) {
//                 let create = (options.rowFunction !== undefined) ? await options.rowFunction(element) : true;
//                 if (create) {
//                     let row = document.createElement('tr');
//                     for (const option of options.table) {
//                         if (option.textFunction !== undefined) row.insertCell().innerHTML = option.textFunction(element, details);
//                         else row.insertCell().innerHTML = element[option.data];
//                     }

//                     tbody.append(row);
//                 }
//             }
//             resolve(tbody);
//         })
//     }
// }

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
    showContent();

    // Helper functions.
    async function createHeader() {
        let thead = document.createElement('thead');
        let tr = document.createElement('tr');
        return new Promise((resolve, reject) => {
            for (const option of options.table) {
                let header = document.createElement('th');
                header.setAttribute('priority', (option.priority) ? `${option.priority}` : '1')
                header.innerHTML = option.name;
                tr.append(header)
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
                    if (options.rowAttribute !== undefined) {
                        row.setAttribute('rowAttr', options.rowAttribute(element))
                    }
                    for (const option of options.table) {
                        let cell = row.insertCell();
                        cell.setAttribute('priority', (option.priority) ? `${option.priority}` : '1')
                        if (option.textFunction !== undefined) cell.innerHTML = option.textFunction(element);
                        else {
                            switch (element[option.data]) {
                                case true: cell.innerHTML = `<div class="tableBoolean">Yes</div>`; cell.classList.add('tableCellBoolean'); break;
                                case false: cell.innerHTML = `<div class="tableBoolean">No</div>`; cell.classList.add('tableCellBoolean'); break;
                                default: cell.innerHTML = element[option.data]; break;
                            }
                        }
                    }
                    if (options.subTable) row.setAttribute('onClick', `this.nextSibling.style.display = (this.nextSibling.style.display === 'none') ? 'table-row' : 'none'`)
                    tbody.append(row);
                    if (options.subTable) {
                        let subRow = document.createElement('tr');
                        subRow.classList.add('subTableRow');
                        let subCell = subRow.insertCell();
                        subCell.setAttribute('colspan', '6');
                        
                        let subTable = document.createElement('table');
                        subTable.classList.add('subTable')
                        for (const option of options.subTable) {
                            let subTableRow = document.createElement('tr');
                            let subCellName = subTableRow.insertCell();
                            subCellName.setAttribute('priority', (option.priority) ? `${option.priority}` : '1')
                            subCellName.innerHTML = option.name;
                            let subCellText = subTableRow.insertCell();
                            subCellText.classList.add('lastCell')
                            if (option.textFunction !== undefined) subCellText.innerHTML = option.textFunction(element);
                            else {
                                switch (element[option.data]) {
                                    case true: subCellText.innerHTML = `<div class="tableBoolean">Yes</div>`; subCellText.classList.add('tableCellBoolean'); break;
                                    case false: subCellText.innerHTML = `<div class="tableBoolean">No</div>`; subCellText.classList.add('tableCellBoolean'); break;
                                    default: subCellText.innerHTML = element[option.data]; break;
                                }
                            }
                            subTable.append(subTableRow);
                        }
                        subCell.append(subTable);
                        tbody.append(subRow);
                        // let subRow = document.createElement('tr');
                        // subRow.classList.add('subTableRow')
                        // for (const option of options.subTable) {
                        //     let subCellName = subRow.insertCell();
                        //     subCellName.setAttribute('priority', (option.priority) ? `${option.priority}` : '1')
                        //     subCellName.innerHTML = option.name;
                        //     let subCellText = subRow.insertCell();
                        //     if (option.textFunction !== undefined) subCellText.innerHTML = option.textFunction(element);
                        //     else {
                        //         switch (element[option.data]) {
                        //             case true: subCellText.innerHTML = `<div class="tableBoolean">Yes</div>`; subCellText.classList.add('tableCellBoolean'); break;
                        //             case false: subCellText.innerHTML = `<div class="tableBoolean">No</div>`; subCellText.classList.add('tableCellBoolean'); break;
                        //             default: subCellText.innerHTML = element[option.data]; break;
                        //         }
                        //     }
                        // }
                        // tbody.append(subRow);
                    }
                }
            }
            resolve(tbody);
        })
    }
}