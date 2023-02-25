let user;
let signin;

// Check user and load page.
async function load(_signin, authOptions) {
    signin = _signin;
    let verify = await POST('verify', authOptions);
    if (signin) {
        if (verify.error) return document.body.style.visibility = 'visible';
        else if (verify.data.admin) return location.href = '/admin/dashboard';
        else return location.href = '/volunteer/dashboard';
    }
    else if (verify.error) {
        switch (verify.status) {
            case 401:
                location.href = '/login';
                window.parent.postMessage({ name: 'login' }, window.parent)
                return;
                break;
            case 403:
                switchLastPage();
                showToast('error', `You are not authorized to view this resource.`);
                return;
                break;
        }
    }
    try {
        let cookie = JSON.parse(document.cookie.split('; ').find((x) => x.startsWith('data='))?.split('=')[1]);
        user = {
            username: cookie.username,
            id: cookie.id,
        }
        pageLoaded();
    } catch(e) {  };
}

// Login function (on login page only).
async function login() {
    let username = document.getElementById('username');
    let password = document.getElementById('password');
    let button = document.getElementById('login');
    let errorText = document.getElementById('invalid')
    let login = await POST('login', { username: username.value, password: password.value });
    if (login.error) {
        errorText.style.visibility = 'visible';
        username.setCustomValidity('Invalid');
        password.setCustomValidity('Invalid');
        username.disabled = false;
        password.disabled = false;
        button.disabled = false;
        return;
    }
    await createCookie(login.data.username, login.data.id, login.data.token)
    if (login.data.admin) setTimeout(() => location.href = '/admin/dashboard', 250);
    else if (login.data.volunteer) setTimeout(() => location.href = '/volunteer/dashboard', 250);
    else setTimeout(() => location.href = '/login', 250);
}

// Logout function.
async function logout() {
    const d = new Date();
    d.setTime(d.getTime() - 10000);
    await GET('logout');
    document.cookie = `data=; expires=${d.toUTCString()}; path=/`;
    location.href = '/login';
    return;
}

function createCookie(username, id, token) {
    return new Promise((resolve, reject) => {
        document.cookie = `data=${JSON.stringify({ username: username, id: id, token: token })}; expires=0; path=/;`;
        resolve();
    })
}

async function setBreadcrumb(event) {
    let breadcrumb = document.querySelector('li#eventBreadcrumb a');
    let eventInfo = await GET(`events/${event}`);
    breadcrumb.innerHTML = eventInfo.data.name;
}

// Page Generators
async function generateTable(options) {

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
            let checkbox = document.createElement('th');
            checkbox.innerHTML = '<input type="checkbox" item="Speedrun ID"</input>';
            tr.append(checkbox)
            for (const option of options.table) {
                let header = document.createElement('th');
                header.setAttribute('priority', (option.priority) ? `${option.priority}` : '1')
                header.innerHTML = option.name;
                tr.append(header)
            }
            let dropdown = document.createElement('th');
            dropdown.innerHTML = '';
            tr.append(dropdown)
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
                    row.insertCell().innerHTML = `<input type="checkbox" item="${element._id}"</input>`;
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
                    if (options.volunteer) {
                        row.insertCell().innerHTML = `
                <div class="tableDropdown">
            <button class="tableButton noDropdown" onClick="volunteerSwitchPage('${options.model}', '${element._id}')"><span class="material-icons-outlined">
                    info
                </span></button>
            `;
                    }
                    else if (options.event !== undefined) {
                        row.insertCell().innerHTML = `
                <div class="tableDropdown">
            <button class="tableButton"><span class="material-icons-outlined">
                    more_horiz
                </span></button>
            <div class="tableDropdownContent">
                <button class="tableDropdownButton" onClick="dropdownSwitchPage('view', '${options.model}', '${element._id}', '${options.event}')"><span
                        class="material-icons-outlined">
                        desktop_windows
                    </span>
                    <div class="tableButtonText">View</div>
                </button>
                <button class="tableDropdownButton" onClick="dropdownSwitchPage('edit', '${options.model}', '${element._id}', '${options.event}')"><span
                        class="material-icons-outlined">
                        edit
                    </span>
                    <div class="tableButtonText">Edit</div>
                </button>
                <button class="tableDropdownButton" onClick="deleteItem('${element._id}', '${options.model}', '${options.name}')"><span
                        class="material-icons-outlined">
                        delete
                    </span>
                    <div class="tableButtonText">Delete</div>
                </button>
            </div>
        </div>`;
                    }
                    else {
                        row.insertCell().innerHTML = `
                <div class="tableDropdown">
            <button class="tableButton"><span class="material-icons-outlined">
                    more_horiz
                </span></button>
            <div class="tableDropdownContent">
                <button class="tableDropdownButton" onClick="dropdownSwitchPage('view', '${options.model}', '${element._id}')"><span
                        class="material-icons-outlined">
                        desktop_windows
                    </span>
                    <div class="tableButtonText">View</div>
                </button>
                <button class="tableDropdownButton" onClick="dropdownSwitchPage('edit', '${options.model}', '${element._id}')"><span
                        class="material-icons-outlined">
                        edit
                    </span>
                    <div class="tableButtonText">Edit</div>
                </button>
                <button class="tableDropdownButton" onClick="deleteItem('${element._id}', '${options.model}', '${options.name}')"><span
                        class="material-icons-outlined">
                        delete
                    </span>
                    <div class="tableButtonText">Delete</div>
                </button>
            </div>
        </div>`;
                    }
                    tbody.append(row);
                }
            }
            resolve(tbody);
        })
    }
}

async function generateForm(options) {

    showBody();

    // Set page title.
    switch (options.type) {
        case 'create': document.querySelector('.title').innerHTML = `Create ${options.name}`; break;
        case 'edit': document.querySelector('.title').innerHTML = `Edit ${options.name}`; break;
        case 'view': document.querySelector('.title').innerHTML = `View ${options.name}`; break;
        default: document.querySelector('.title').innerHTML = `View ${options.name}`; break;
    }

    // Generate datalists (if needed).
    if (options.datalist !== undefined) {
        for (const key of Object.keys(options.datalist)) {
            let datalist = document.createElement('datalist');
            datalist.setAttribute('id', key)
            let datalistData = await GET(options.datalist[key].endpoint);
            for (const item of datalistData.data) {
                datalist.innerHTML += `<option dataId="${item._id}" value="${options.datalist[key].textFunction(item)}">ID: ${item._id}</option>`
            }
            document.querySelector('.content').append(datalist);
        }
    }

    // Create form.
    let form = document.createElement('form');

    // Get data from API.
    let data;
    if (options.type !== 'create') data = await GET(options.endpoint);

    // Add ID field to form.
    if (options.type !== 'create') {
        let idDiv = document.createElement('div');
        idDiv.setAttribute('id', 'id');
        idDiv.setAttribute('class', 'inputDiv');
        idDiv.innerHTML = `
        <label class="label">ID</label>
        <input class="input" value="${data.data._id}" disabled></input>
        <span class="errorText"></span>`
        form.append(idDiv);
    }

    // Generate form data.
    await createFields();

    // Create submit button.
    if (options.type !== 'view') {
        let button = document.createElement('button');
        button.setAttribute('type', 'button')
        button.onclick = function () { submit(options) };
        button.innerHTML = (options.type === 'create') ? 'Create' : 'Submit'
        form.append(button);
    }

    // Append to page.
    document.querySelector('.content').append(form);

    // Setup help button.
    if (options.help !== undefined) document.querySelector('.helpButton').setAttribute('onClick', `window.open('${options.help}', '_blank')`)
    else document.querySelector('.helpButton').style.display = 'none';

    // Show content.
    showContent();

    // Helper functions.
    async function createFields() {
        return new Promise(async (resolve, reject) => {
            for (const field of options.form) {
                let div = document.createElement('div');
                div.setAttribute('id', field.data);
                if (field.type === 'array') div.setAttribute('class', 'arrayInputDiv');
                else div.setAttribute('class', 'inputDiv');

                let label = document.createElement('label');
                label.setAttribute('class', 'label');
                label.innerHTML = field.name;

                if (field.required) label.innerHTML += `<span class="required"> ✱</span>`

                let input;
                if (field.type === 'select') {
                    input = document.createElement('select');
                    for (const option of Object.keys(field.options)) {
                        let optionElement = document.createElement('option');
                        optionElement.setAttribute('value', option);
                        optionElement.innerHTML = field.options[option];
                        input.append(optionElement);
                    }
                    input.selectedIndex = "0";
                }
                else if (field.type === 'array') input = await createArrayFields(field);
                else if (field.type === 'textarea') input = document.createElement('textarea');
                else {
                    input = document.createElement('input');
                    input.setAttribute('class', 'input');
                    input.setAttribute('type', field.type);
                }

                if (field.attributes !== undefined) {
                    for (const attribute of Object.keys(field.attributes)) {
                        if (attribute === 'innerHTML') input.innerHTML = field.attributes[attribute];
                        else input.setAttribute(attribute, field.attributes[attribute]);
                    };
                }

                let span = document.createElement('span');
                span.setAttribute('class', 'errorText');

                if (options.type !== 'create' && field.type !== 'array') {
                    if (field.textFunction !== undefined) input[(field.type === 'checkbox') ? 'checked' : 'value'] = field.textFunction(data.data);
                    else input[(field.type === 'checkbox') ? 'checked' : 'value'] = data.data[field.data];
                }

                if (options.type === 'view' && field.type !== 'array') input.disabled = true;

                div.append(label, input, span);
                form.append(div);
            }
            resolve();
        })
    }

    async function createArrayFields(field) {
        let containerDiv = document.createElement('div');
        containerDiv.setAttribute('class', 'array container');

        let mainDiv = document.createElement('div');
        mainDiv.setAttribute('class', 'array div');

        if (options.type !== 'create') {
            let count = 0;
            for (const array of field.array) {
                try {
                for (const fieldData of data.data[field.data]) {
                    if (options.type !== 'create' && data.data[field.data][count] !== undefined) mainDiv.append(await addArrayElement(field, fieldData)) //data.data[field.data][count]
                    else if (options.type === 'create') mainDiv.append(await addArrayElement(field))
                    count++;
                }
            } catch {}
            }
        }

        containerDiv.append(mainDiv);

        if (options.type !== 'view') {
            let addButton = document.createElement('button');
            addButton.setAttribute('type', 'button');
            addButton.setAttribute('class', 'array addButton');
            addButton.onclick = function () { addToArray(field) };
            addButton.innerHTML = 'New Item';
            containerDiv.append(addButton)
        }

        return containerDiv;
    }

    async function addArrayElement(field, fieldData) {

        return new Promise(async (resolve, reject) => {
            let div = document.createElement('div');
            div.setAttribute('class', 'array childDiv');

            for (const arrayField of field.array) {
                let inputDiv = document.createElement('div');

                let label = document.createElement('label');
                label.setAttribute('class', 'label');
                label.innerHTML = arrayField.name;

                if (arrayField.required) label.innerHTML += `<span class="required"> ✱</span>`

                let input;
                if (arrayField.type === 'select') {
                    input = document.createElement('select');
                    for (const option of Object.keys(arrayField.options)) {
                        let optionElement = document.createElement('option');
                        optionElement.setAttribute('value', option);
                        optionElement.innerHTML = arrayField.options[option];
                        input.append(optionElement);
                    }
                    input.selectedIndex = "0";
                }
                else input = document.createElement('input');
                input.setAttribute('class', 'input');
                input.setAttribute('type', arrayField.type);

                if (arrayField.attributes !== undefined) {
                    for (const attribute of Object.keys(arrayField.attributes)) {
                        if (attribute === 'innerHTML') input.innerHTML = arrayField.attributes[attribute];
                        else input.setAttribute(attribute, arrayField.attributes[attribute]);
                    };
                }

                if (options.type !== 'create' && fieldData !== undefined) {
                    if (arrayField.data === undefined && arrayField.textFunction !== undefined) input[(arrayField.type === 'checkbox') ? 'checked' : 'value'] = await arrayField.textFunction(fieldData, input);
                    else if (arrayField.textFunction !== undefined) input[(arrayField.type === 'checkbox') ? 'checked' : 'value'] = await arrayField.textFunction(fieldData, input);
                    else if (arrayField.data === undefined) input[(arrayField.type === 'checkbox') ? 'checked' : 'value'] = fieldData;
                    else input[(arrayField.type === 'checkbox') ? 'checked' : 'value'] = fieldData[arrayField.data];
                }

                if (options.type === 'view') input.disabled = true;

                inputDiv.append(label, input)
                div.append(inputDiv);
            }

            if (options.type !== 'view') {
                let button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.setAttribute('class', 'array deleteButton material-icons-outlined');
                button.setAttribute('onClick', 'this.parentNode.remove()');
                button.innerHTML = 'delete_forever';
                div.append(button);
            }

            resolve(div);
        })
    }

    async function addToArray(field) {
        document.querySelector(`#${field.data} .array.div`).append(await addArrayElement(field))
    }
}

// Submit data.
async function submit(options) {

    try { submitPressed() } catch { };

    // Hide page content while validating.
    hideContent()

    // Clear any errors.
    let elementList = document.querySelectorAll('.content .inputDiv');
    [...elementList].forEach(element => {
        let el = document.querySelector(`#${element.id} .errorText`)
        try {
            el.innerHTML = '';
            el.style.visibility = 'none';
        } catch { };
    });

    // Generate form data.
    let data = {};
    for (const field of options.form) {
        if (field.submit === undefined) test = '1'
        else if (field.type === 'array') data[field.data] = await field.submit(document.querySelector(`form #${field.data}`));
        else if (field.type === 'select') data[field.data] = await field.submit(document.querySelector(`form #${field.data} select`).value)
        else if (field.type === 'textarea') data[field.data] = await field.submit(document.querySelector(`form #${field.data} textarea`).value)
        else data[field.data] = await field.submit(document.querySelector(`form #${field.data} input`)[(field.type === 'checkbox') ? 'checked' : 'value'])
    };

    if (options.other !== undefined) {
        for (const field of options.other) {
            data[field.data] = await field.submit()
        }
    }

    // Send form data.
    let save = await POST(options.endpoint, data);

    // If API sent no errors.
    if (!save.error) {
        showToast('success', `${options.name} updated successfully.`)
        if (options.model === 'events') refreshNav();
        if (options.volunteer) return switchPage(`/content/pages/dashboard/volunteer/${options.model}/${options.model}.html`)
        if (options.event !== undefined) return switchPage(`/content/pages/dashboard/admin/${options.model}/${options.model}.html?event=${options.event}`)
        return switchPage(`/content/pages/dashboard/admin/${options.model}/${options.model}.html`)
    }

    // If errors, show errors on page.
    showContent();
    if (save.data.error === 'Invalid input.') {
        showToast('error', `Validation errors found, please resolve them.`)
        save.data.errorCodes.forEach(error => {
            let element = document.querySelector(`.content #${error.item} .errorText`);
            element.innerHTML = error.code;
            element.style.visibility = 'inherit';
        })
    }
    else showToast('error', save.data.error)

    return;
}

function dropdownSwitchPage(page, model, id, event) {
    if (event !== undefined) {
        switch (page) {
            case 'view': window.parent.postMessage({ name: 'page', data: `/content/pages/dashboard/admin/${model}/edit.html?type=view&id=${id}&event=${event}` }, window.parent); break;
            case 'edit': window.parent.postMessage({ name: 'page', data: `/content/pages/dashboard/admin/${model}/edit.html?type=edit&id=${id}&event=${event}` }, window.parent); break;
        }
    }
    else {
        switch (page) {
            case 'view': window.parent.postMessage({ name: 'page', data: `/content/pages/dashboard/admin/${model}/edit.html?type=view&id=${id}` }, window.parent); break;
            case 'edit': window.parent.postMessage({ name: 'page', data: `/content/pages/dashboard/admin/${model}/edit.html?type=edit&id=${id}` }, window.parent); break;
        }
    }
}

function volunteerSwitchPage(model, id) {
    window.parent.postMessage({ name: 'page', data: `/content/pages/dashboard/volunteer/${model}/edit.html?id=${id}` }, window.parent);
}

// Delete function.
async function deleteItem(id, model, name) {
    let verify = await POST('verify', { model: model, level: 'full' });
    if (verify.error) return showToast('error', `You are not authorized to delete this resource.`);
    window.parent.postMessage({
        name: 'dialog', data: {
            model: model,
            name: name,
            endpoint: `${model}/${id}`,
        }
    }, window.parent)
    return;
}


// API Calls
async function createAPIHeader() {
    return new Promise((resolve, reject) => {
        let headers = { 'Content-Type': 'application/json' };
        let cookies = document.cookie.split('; ').find((x) => x.startsWith('data='))?.split('=')[1];
        if (cookies) headers["Authorization"] = `Bearer ${JSON.parse(cookies).token}`;
        resolve(headers);
    })
}

async function GET(endpoint) {
    let response = await fetch(`/api/${endpoint}`, { method: 'GET', headers: await createAPIHeader() });
    let data = await response.json();
    switch (response.status) {
        case 200: return { error: false, status: response.status, data: data }; break;
        default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
    }
}

async function POST(endpoint, body) {
    let response = await fetch(`/api/${endpoint}`, { method: 'POST', headers: await createAPIHeader(), body: JSON.stringify(body) });
    let data = await response.json();
    switch (response.status) {
        case 200: return { error: false, status: response.status, data: data }; break;
        default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
    }
}

async function PUT(endpoint, body) {
    let response = await fetch(`/api/${endpoint}`, { method: 'PUT', headers: await createAPIHeader(), body: JSON.stringify(body) });
    let data = await response.json();
    switch (response.status) {
        case 200: return { error: false, status: response.status, data: data }; break;
        default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
    }
}

async function DELETE(endpoint, body) {
    let response = await fetch(`/api/${endpoint}`, { method: 'DELETE', headers: await createAPIHeader(), body: JSON.stringify(body) });
    let data = await response.json();
    switch (response.status) {
        case 200: return { error: false, status: response.status, data: data }; break;
        default: apiError(response, data); return { error: true, status: response.status, data: data }; break;
    }
}

async function apiError(error, body) {
    if (error.status === 401 && !signin) return location.href = '/login';
    else if (error.status !== 409) showToast('error', `An API error has occured. Please check the browser console for more details.`)
    if (error.status !== 401 && error.status !== 409 && error.status !== 403) console.error('Error while making API request.\n\n', `Status:`, error.status, `\nStatus Text:`, body, `\nRequested Endpoint:`, error.url, `\n\nIf this issue persists, please open an issue in the Github repository https://github.com/Indiethon/donation-tracker/issues`);
}

// Other helper functions.
function switchPage(page) {
    try { document.getElementById('sidebar').classList.remove('visible') } catch { }
    try { document.getElementById('mainPageShadow').classList.remove('visible') } catch { }
    window.parent.postMessage({ name: 'page', data: page }, window.parent)
}

function switchLastPage() {
    window.parent.postMessage({ name: 'lastPage' }, window.parent)
}

function forceLogout() {
    window.parent.postMessage({ name: 'login' }, window.parent)
}

function showPopup(type, message) {
    window.parent.postMessage({ name: 'popup', data: { type: type, message: message } }, window.parent)
}

function showToast(type, message) {
    window.parent.postMessage({ name: 'toast', data: { type: type, message: message } }, window.parent)
}

function showDialog(data) {
    window.parent.postMessage({ name: 'dialog', data: data }, window.parent)
}

function showBody() {
    document.body.style.visibility = 'visible';
}

function showContent() {
    document.querySelector('.loadingContent').style.display = 'none';
    for (const content of document.querySelectorAll('.content')) {
        content.style.visibility = 'visible';
    }
}

function hideContent() {
    document.querySelector('.loadingContent').style.display = 'flex';
    for (const content of document.querySelectorAll('.content')) {
        content.style.visibility = 'hidden';
    }
}

function refreshNav() {
    window.parent.postMessage({ name: 'event', data: {} }, window.parent)
}

// Listen for events from parent.
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    switch (event.data.name) {
        case 'reload': location.reload(); break;
    }
}, false);