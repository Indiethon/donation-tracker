load(false, { model: null });

async function pageLoaded() {
    let userData = await GET(`users/${user.id}`);
    if (userData.data.superuser || userData.data.admin) document.querySelector('#adminView').style.display = 'flex';
    showBody();
}

function expand(element, button) {
    let div = document.getElementById(element);
    if (!div.classList.contains('visible')) {
        div.classList.add('visible')
        button.classList.add('pressed')
        return;
    }
    div.classList.remove('visible')
    button.classList.remove('pressed')
}

function expandEvent(element, event, button) {
    let div = document.querySelector(`#${element}[event="${event}"]`);
    if (!div.classList.contains('visible')) {
        div.classList.add('visible')
        button.classList.add('pressed')
        return;
    }
    div.classList.remove('visible')
    button.classList.remove('pressed')
}

window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    switch (event.data.name) {
        case 'page': document.getElementById('pageFrame').src = event.data.data; break;
        case 'popup': showPopup(event.data.data); break;
        case 'toast': showToast(event.data.data); break;
        case 'dialog': showDialog(event.data.data); break;
        case 'login': location.href = '/login'; break;
        case 'event': updateNav(); break;
    }

}, false);

function showPopup(data) {
    console.table(data)
}

function showToast(data) {
    let toastContent = document.getElementById('toastContent');
    switch (data.type) {
        case 'success':
            document.getElementById('toastHeader').style.backgroundColor = '#42A086';
            toastContent.style.backgroundColor = '#8EF3C5';
            break;
        case 'error':
            document.getElementById('toastHeader').style.backgroundColor = '#FF4567';
            toastContent.style.backgroundColor = '#FFA5B5';
            break;
    }
    let toast = document.getElementById('toast');
    toastContent.innerHTML = data.message;
    toast.className = 'showToast';
    setTimeout(() => toast.classList.remove("showToast"), 5000);
}

function showDialog(data) {
    document.getElementById('dialogText').innerHTML = `Are you sure you want to delete ${data.model} ${data.name}?`;
    document.getElementById('dialogDelete').setAttribute('endpoint', data.endpoint);
    document.getElementById('dialog').style.display = 'block';
}

function dialogConfirm(button) {
    document.getElementById('dialog').style.display = 'none';
    DELETE(`${button.getAttribute('endpoint')}`, {}, (err, result) => {
        if (err) return showToast({ type: 'error', message: 'Error when deleting resource. Check the browser console for more details.' })
        document.querySelector('#pageFrame').contentWindow.postMessage({ name: 'reload' }, document.querySelector('#pageFrame'))
        if (button.getAttribute('endpoint').includes('event')) updateNav();
        return showToast({ type: 'success', message: 'Successfully deleted resource.' })
    })
}

function showNavbar() {
    document.getElementById('sidebar').classList.add('visible');
    document.getElementById('mainPageShadow').classList.add('visible')
}

function hideNavbar() {
    if (!document.getElementById('sidebar').classList.contains('visible')) return;
    document.getElementById('sidebar').classList.remove('visible');
    document.getElementById('mainPageShadow').classList.remove('visible');
}