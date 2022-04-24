let user;
let signin;

function load(signinPage) {
    apiUrl = window.location.origin;
    signin = signinPage;
    GET('verify', (error, result) => {
        if (signinPage) {
            if (error) return document.body.style.visibility = 'visible';
            return location.href = '/admin/dashboard';
        }
        if (error) {
            forceLogout();
            location.href = '/login';
            return;
        }
        try {
            let cookie = JSON.parse(document.cookie.substring(5))
            user = {
                username: cookie.username,
                id: cookie.id,
            }
            pageLoaded()
        } catch { };
    })
}

function login() {
    let username = document.getElementById('username');
    let password = document.getElementById('password');
    let button = document.getElementById('login');
    let errorText = document.getElementById('invalid')
    POST('login', { username: username.value, password: password.value }, (error, result) => {
        if (error) {
            errorText.style.visibility = 'visible';
            username.setCustomValidity('Invalid');
            password.setCustomValidity('Invalid');
            username.disabled = false;
            password.disabled = false;
            button.disabled = false; return
        }
        createCookie(result.data.username, result.data.id, result.data.token)
        setTimeout(() => location.href = '/admin/dashboard', 250)
    })
}
function logout() {
    const d = new Date();
    d.setTime(d.getTime() - 10000);
    GET('logout', (error, result) => {
        document.cookie = `data=; expires=${d.toUTCString()}; path=/`;
        location.href = '/login'
    })
}

function apiError(error) {
    if (error.status === 401 && !signin) location.href = '/login';
    else console.error(error)
}

function createCookie(username, id, token) {
    document.cookie = `data=${JSON.stringify({ username: username, id: id, token: token })}; expires=0; path=/;`;
}

function GET(endpoint, callback) {
    let headers;
    try { headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(document.cookie.substring(5)).token}` } }
    catch { headers = { 'Content-Type': 'application/json' } }
    fetch(`${window.location.origin}/api/${endpoint}`, {
        method: 'GET',
        headers: headers,
    }).then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {
            switch (result.status) {
                case 200: callback(false, result); break;
                default: apiError(result); callback(true, result); break;
            }
        })
}

function POST(endpoint, body, callback) {
    let headers;
    try { headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(document.cookie.substring(5)).token}` } }
    catch { headers = { 'Content-Type': 'application/json' } }
    fetch(`${window.location.origin}/api/${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    }).then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {
            switch (result.status) {
                case 200: callback(false, result); break;
                default: apiError(result); callback(true, result); break;
            }
        })
}

function PUT(endpoint, body, callback) {
    let headers;
    try { headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(document.cookie.substring(5)).token}` } }
    catch { headers = { 'Content-Type': 'application/json' } }
    fetch(`${window.location.origin}/api/${endpoint}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    }).then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {
            switch (result.status) {
                case 200: callback(false, result); break;
                default: apiError(result); callback(true, result); break;
            }
        })
}

function DELETE(endpoint, body, callback) {
    let headers;
    try { headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(document.cookie.substring(5)).token}` } }
    catch { headers = { 'Content-Type': 'application/json' } }
    fetch(`${window.location.origin}/api/${endpoint}`, {
        method: 'DELETE',
        headers: headers,
        body: JSON.stringify(body)
    }).then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {
            switch (result.status) {
                case 200: callback(false, result); break;
                default: apiError(result); callback(true, result); break;
            }
        })
}

function switchPage(page) {
    window.parent.postMessage({ name: 'page', data: page }, window.parent)
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
    document.querySelector('.content').style.visibility = 'visible';
}

function refreshNav() {
    window.parent.postMessage({ name: 'event', data: {}}, window.parent)
}