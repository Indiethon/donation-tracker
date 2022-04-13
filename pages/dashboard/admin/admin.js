function pageLoaded() {
    document.querySelector('#welcomeText').innerHTML = `Welcome ${user.username}!`
    GET('events/list', (err, data) => {
        if (err) return;
        let nav = document.getElementById('navEvents');
        for (const event of data.data) {
            nav.innerHTML += `
            <button onClick="expandEvent('eventNav', '${event}', this)">${event}</button>
            <div class="navDropdownDiv" id="eventNav" event="${event}">
            <button>Overview</button>
            <button>Speedruns</button>
            <button>Donations</button>
            <button>Incentives</button>
            <button>Prizes</button>
            <button>Ads</button>
            </div>
            `
        }
        showBody();
    })
}

function expand(element, button) {
    let div = document.getElementById(element);
    if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'inherit';
        button.style.backgroundColor = 'lightblue';
        return;
    }
    div.style.display = 'none';
    button.style.backgroundColor = '#E2E2E2';
}

function expandEvent(element, event, button) {
    let div = document.querySelector(`#${element}[event="${event}"]`);
    if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'inherit';
        button.style.backgroundColor = 'lightblue';
        return;
    }
    div.style.display = 'none';
    button.style.backgroundColor = '#E2E2E2';
}

window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    switch (event.data.name) {
        case 'page': document.getElementById('pageFrame').src = event.data.data; break;
        case 'popup': showPopup(event.data.data); break;
        case 'toast': showToast(event.data.data); break;
        case 'dialog': showDialog(event.data.data); break;
        case 'login': location.href = '/login'; break;
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
        if (err) return showToast('error', 'Error when deleting resource.')
        document.querySelector('#pageFrame').contentWindow.postMessage({ name: 'reload' }, document.querySelector('#pageFrame'))
        return showToast({ type: 'success', message: 'Successfully deleted resource.' })
    })
}