let user;
let signin;

// const currentMatch = nodecg.Replicant('currentMatch')
// const playerDatabase = nodecg.Replicant('playerDatabase');
// const cardList = nodecg.Replicant('cardList')

// NodeCG.waitForReplicants(playerDatabase, cardList).then(() => {
//     cardList.on('change', (newVal) => {
//         for (let commander in newVal.commander) {
//             cmdrDatalist = cmdrDatalist + `<option data-value="${commander}" value="${newVal.commander[commander]}">`
//         }
//         try { document.getElementById('cmdrDatalist').innerHTML = cmdrDatalist; } catch (e) { console.log(e) }
//     })
//     try { replicantsLoaded() } catch { }
// });

// nodecg.listenFor('forceLogOutUser', (value) => {
//     if (value.length <= 0 || value.includes(user.username))
//         location.href = '/signin'
// })

// function loadPage(signin) {
//     document.getElementById('main').style.visibility = 'visible'
//     if (signin)
//         verifyLoginToken();
//     else
//         verifyToken()
// }

// function verifyLoginToken() {
//     try {
//         nodecg.sendMessage('verifyToken', JSON.parse(document.cookie.substring(5)).token, (error, result) => {
//             if (!error)
//                 location.href = '/player/home'
//             else
//                 document.getElementById('main').style.visibility = 'visible'
//         });
//     } catch {
//         document.getElementById('main').style.visibility = 'visible'
//     }
//     document.getElementById('loginButton').disabled = false;
// }


// function verifyToken() {

//     try {
//         nodecg.sendMessage('verifyToken', JSON.parse(document.cookie.substring(5)).token, (error, result) => {
//             if (error)
//                 location.href = '/signin'
//             else {
//                 document.getElementById('mainDiv').style.visibility = 'visible';
//                 user.username = JSON.parse(document.cookie.substring(5)).username;
//                 user.id = JSON.parse(document.cookie.substring(5)).id;
//             }
//         });
//     } catch { location.href = '/signin' }
// }

function load(signinPage) {
    signin = signinPage;
    // GET('verify', (error, result) => {
    //     if (signinPage) {
    //         if (error) { document.getElementById('main').style.visibility = 'visible'; return; }
    //         location.href = '/player/home'; return;
    //     }
    //     if (error) { location.href = '/'; return; }
    //     document.getElementById('mainDiv').style.visibility = 'visible';
    //     GET('user', (error, result) => {
    //         if (error) { location.href = '/'; return; }
    //         user = result.data;
    //     })
    //     GET('cards', (error, result) => {
    //         if (error) return;
    //         cardList = result.data.list;
    //         try { 
    //             document.getElementById('cmdrDatalist').innerHTML = result.data.datalist;
    //             document.getElementById('partnerDatalist').innerHTML = result.data.partnerDatalist;
    //         } catch {}
    //         pageLoaded();
    //     })
    // })
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
        setTimeout(() => location.href = '/donate', 250)
    })
}
function logout() {
    const d = new Date();
    d.setTime(d.getTime() - 10000);
    GET('logout', (error, result) => {
        document.cookie = `data=; expires=${d.toUTCString()}; path=/`;
        location.href = '/'
    })
}

function apiError(error) {
    if (error.status === 401 && !signin) location.href = '/';
    else console.error(error)
}

function createCookie(username, id, token) {
    document.cookie = `data=${JSON.stringify({ username: username, id: id, token: token })}; expires=0; path=/`;
}

function GET(endpoint, callback) {
    let headers;
    try { headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(document.cookie.substring(5)).token}` } }
    catch { headers = { 'Content-Type': 'application/json' } }
    fetch(`${apiUrl}/api/${endpoint}`, {
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
    fetch(`${apiUrl}/api/${endpoint}`, {
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
    fetch(`${apiUrl}/api/${endpoint}`, {
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
    fetch(`${apiUrl}/api/${endpoint}`, {
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