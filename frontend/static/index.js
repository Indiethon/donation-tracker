import Home from "/content/views/home.js";
import Runs from "/content/views/runs.js";
import Incentives from "/content/views/incentives.js";
import Prizes from "/content/views/prizes.js";
import Donations from "/content/views/donations.js";
import Donate from "/content/views/donate/donate.js";
import DonateSuccess from "/content/views/donate/success.js";
import DonateError from "/content/views/donate/error.js";
import PrizeSuccess from "/content/views/prize/success.js";
import PrizeError from "/content/views/prize/error.js";
import PrizeForfeit from "/content/views/prize/forfeit.js";

let event = new URLSearchParams(window.location.search).get('event');
let loadedScripts = [];
let match;

let details = {};

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const router = async () => {

    const routes = [
        { name: "Home", path: '/home', view: Home },
        { name: "Runs", path: '/runs', view: Runs },
        { name: "Incentives", path: '/incentives', view: Incentives },
        { name: "Prizes", path: '/prizes', view: Prizes },
        { name: "Donations", path: '/donations', view: Donations },
        { name: "Home", path: '/', view: Home },
        { name: "Donate", path: '/donate', view: Donate },
        { name: "Donation Successful", path: '/donate/success', view: DonateSuccess },
        { name: "Donation Error", path: '/donate/error', view: DonateError },
        { name: "Prize Claim Successful", path: '/prize/claim/success', view: PrizeSuccess },
        { name: "Prize Claim Error", path: '/prize/claim/error', view: PrizeError },
        { name: "Prize Forfeit Successful", path: '/prize/forfeit/success', view: PrizeForfeit },
        { name: "Prize Forfeit Error", path: '/prize/forfeit/error', view: PrizeError },

    ]

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path)),
            event: event,
        };
    });

    match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

    let head = document.querySelector('head');
    let header = document.querySelector('header');
    let main = document.querySelector('main');
    let footer = document.querySelector('footer');
    let spinnerDiv = document.querySelector('.spinnerDiv');

    main.style.display = 'none';
    spinnerDiv.style.display = 'inline-block';

    const view = new match.route.view(event, details);

    if (match.route.path.includes('/donate')) event = details.activeEvent.short;
    document.querySelector('title').innerHTML = `${match.route.name} | ${(event) ? details.eventList[event] : 'All Events'}`
    document.querySelector('[property="og:title"]').setAttribute('content', `${match.route.name} | ${(event) ? details.eventList[event] : 'All Events'}`);
    document.querySelector('[property="og:url"]').setAttribute('content', `${details.url}${match.route.path}${(event) ? '?event=' + event : ''}`);

    header.innerHTML = '';
    main.innerHTML = '';
    footer.innerHTML = '';

    let imports = head.querySelectorAll('[import=""]');
    for (let headImport of imports) {
        headImport.remove();
    }

    if (view.events.getHeader) header.innerHTML = await view.events.getHeader(details);

    if (view.events.getPreMain) main.innerHTML = await view.events.getPreMain(details);
    if (view.events.table) await generateTable(view.events.table);
    if (view.events.getPostMain) main.innerHTML += await view.events.getPostMain(details);

    if (view.events.getFooter) footer.innerHTML = await view.events.getFooter(new window.Intl.DateTimeFormat().resolvedOptions().timeZone);

    if (view.events.runFunction) await view.events.runFunction(details);

    if (view.stylesheets) {
        let promiseArray = [];
        view.stylesheets.forEach(async stylesheet => {
            promiseArray.push(new Promise(async (resolve, reject) => {

                let link = document.createElement('link');
                link.setAttribute('rel', 'stylesheet');
                link.setAttribute('href', stylesheet);
                link.setAttribute('import', '')
                link.onload = () => resolve();

                head.appendChild(link)
            }))
        })

        await Promise.all(promiseArray)
    }

    if (view.scripts) {
        let promiseArray = [];

        view.scripts.forEach(async jsScript => {
            promiseArray.push(new Promise(async (resolve, reject) => {

                if (loadedScripts.includes(jsScript)) return resolve();

                let script = document.createElement('script');
                script.setAttribute('src', jsScript);
                script.setAttribute('import', '')
                script.onload = () => resolve();

                head.appendChild(script);
                loadedScripts.push(jsScript);
            }))
        })

        await Promise.all(promiseArray)
    }

    try { load(details) } catch { }

    if (view.waitForScript) return;
    spinnerDiv.style.display = 'none';
    main.style.display = 'inline-block';
}

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", async () => {

    let res = await fetch('/api/details', { method: 'GET' });
    details = await res.json();
    if (details.activeEvent) document.querySelector('.topNavDonate').style.display = 'inline-block'
    if (details.analyticsMeasurmentId) attatchAnalytics(details.analyticsMeasurmentId);

    if (!window.location.pathname.includes('?event=') && details.activeEvent) {
        let href = `${window.location.pathname}?event=${details.activeEvent.short}`;
        event = details.activeEvent.short;
        history.pushState(null, null, href);
    }

    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            let href = (event) ? `${e.target.href}?event=${event}` : e.target.href;
            if (match.route.path.includes('/donate')) {
                href = `${e.target.href}?event=${details.activeEvent.short}`;
                event = details.activeEvent.short;
            }
            if (e.target.href.includes('/donate')) href = '/donate'
            history.pushState(null, null, href);
            router();
        };
    });

    router();
});

function attatchAnalytics(measurmentId) {
    let script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurmentId}`;

    let script2 = document.createElement('script');
    script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', '${measurmentId}');
        `

    document.querySelector('head').appendChild(script1)
    document.querySelector('head').appendChild(script2)
}

function changePath(short) {
    event = short;
    let href = (short) ? `${window.location.pathname}?event=${short}` : window.location.pathname;
    history.pushState(null, null, href);
    router();
}

window.changePath = changePath;