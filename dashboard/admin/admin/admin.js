let timer = null;

load(false, { model: null });

function pageLoaded() {
    document.querySelector('#welcomeText').innerHTML = `Welcome ${user.username}!`
    updateNav();
}

async function updateNav() {
    let nav = document.getElementById('navEvents');
    nav.innerHTML = '<div class="navEventText">EVENTS</div>';
    let events = await GET('events');
    for (const event of events.data) {
        nav.innerHTML += `
            <button class="mainNavButton" onClick="expandEvent('eventNav', '${event._id}', this)">
            <div class="buttonText">${event.name}</div>
                    <span class="material-icons-outlined button-expand">expand_more</span>
            </button>
            <div class="navDropdownDiv" id="eventNav" event="${event._id}">
            <button onClick="switchPage('/content/pages/dashboard/admin/overview/overview.html?event=${event._id}')">Overview</button>
            <button onClick="switchPage('/content/pages/dashboard/admin/speedruns/speedruns.html?event=${event._id}')">Speedruns</button>
            <button onClick="switchPage('/content/pages/dashboard/admin/donations/donations.html?event=${event._id}')">Donations</button>
            <button onClick="switchPage('/content/pages/dashboard/admin/incentives/incentives.html?event=${event._id}')">Incentives</button>
            <button onClick="switchPage('/content/pages/dashboard/admin/prizes/prizes.html?event=${event._id}')">Prizes</button>
            <button onClick="switchPage('/content/pages/dashboard/admin/ads/ads.html?event=${event._id}')">Ads</button>
            </div>
            `
    }
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
        case 'page':
            document.querySelector('#pageFrame').setAttribute('srcOld', document.getElementById('pageFrame').src);
            document.getElementById('pageFrame').src = event.data.data;
            break;
        case 'lastPage': document.getElementById('pageFrame').src = document.getElementById('pageFrame').getAttribute('srcOld'); break;
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
    let toast = document.getElementById('toast');
    if (timer !== null) {
        clearTimeout(timer);
        toast.classList.remove("showToast");
        setTimeout(() => setToastState(data), 750)
    }
    else setToastState(data);

    function setToastState(data) {
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
            case 'working':
                document.getElementById('toastHeader').style.backgroundColor = '#A08A42';
                toastContent.style.backgroundColor = '#F3D18E';
                break;
        }
        toastContent.innerHTML = data.message;
        toast.className = 'showToast';
        timer = setTimeout(() => {
            toast.classList.remove("showToast");
            timer = null;
        }, 5000);
    }
}

async function showDialog(data) {
    if (data.custom === undefined) document.getElementById('dialogText').innerHTML = `Are you sure you want to delete ${data.model} ${data.name}?`;
    else document.getElementById('dialogText').innerHTML = data.custom;
    document.getElementById('dialogDelete').setAttribute('endpoint', data.endpoint);
    document.getElementById('dialog').style.display = 'block';
}

async function dialogConfirm(button) {
    document.getElementById('dialog').style.display = 'none';
    let del = await DELETE(`${button.getAttribute('endpoint')}`, {});
    if (del.error) return showToast({ type: 'error', message: 'Error when deleting resource. Check the browser console for more details.' })
    document.querySelector('#pageFrame').contentWindow.postMessage({ name: 'reload' }, document.querySelector('#pageFrame'))
    if (button.getAttribute('endpoint').includes('event')) updateNav();
    return showToast({ type: 'success', message: 'Successfully deleted resource.' })

    // DELETE(`${button.getAttribute('endpoint')}`, {}, (err, result) => {
    //     if (err) return showToast({ type: 'error', message: 'Error when deleting resource. Check the browser console for more details.' })
    //     document.querySelector('#pageFrame').contentWindow.postMessage({ name: 'reload' }, document.querySelector('#pageFrame'))
    //     if (button.getAttribute('endpoint').includes('event')) updateNav();
    //     return showToast({ type: 'success', message: 'Successfully deleted resource.' })
    // })
}