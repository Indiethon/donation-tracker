function pageLoaded() {
    GET('events/list', (err, data) => {
        if (err) return;
        let nav = document.getElementById('navEvents');
        data.data.forEach(event => {
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
        })
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
    document.getElementById('pageFrame').src = event.data;
}, false);