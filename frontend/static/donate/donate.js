let donationData = {
    alias: 'Anonymous',
    email: null,
    amount: null,
    comment: '',
    incentives: [],
    custom: {},
};

let selectedIncentive = {};

let donationDetails = {};

const textareaPlaceholderArray = [
    'cheeky',
    'weird',
    'interesting',
    'surprising',
    'embarrasing',
    'silly',
    'funny',
    'emotional',
    'heartwarming'
]

async function load() {
    if (!window.location.pathname.includes('/donate')) return;
    document.querySelector('textarea').setAttribute('placeholder', `Insert ${textareaPlaceholderArray[Math.floor(Math.random() * textareaPlaceholderArray.length)]} comment here...`)

    let res = await fetch('/api/donation/info');
    donationDetails = await res.json();

    document.getElementById('privacyPolicy').href = details.privacyPolicy;
    document.getElementById('sweepstakesRules').href = details.sweepstakesRules;
    document.querySelector('.pageSubtitle').innerHTML = `100% of your donation goes to ${details.activeEvent.charity.name}.`

    // let div = document.querySelector('#custom');
    // for (const custom of data.custom) {
    //     if (custom.type !== 'select') {
    //         div.innerHTML += `
    //             <div customId="${custom.id}" class="inputDiv">
    //                 <label class="label">${custom.name}</label>
    //                 <input class="input" type="${custom.type}">
    //                 <div class="errorText">Error</div>
    //             </div>
    //             `
    //     }
    // }

    let amountInput = document.querySelector('#amount input');
    let inputUnit = document.querySelector('.inputUnitTest');
    inputUnit.innerHTML = details.currencySymbol;
    let unitWidth = inputUnit.offsetWidth;
    amountInput.style.paddingLeft = `${unitWidth + 12}px`;
    amountInput.style.width = `calc(100% - ${unitWidth + 4}px)`
    document.querySelector('#amount .inputUnit').innerHTML = details.currencySymbol;
    if (donationDetails.incentives.length <= 0) document.querySelector('#incentives').style.display = 'none';
    document.querySelector('#amount .inputSubtext').innerHTML = `Minimum donation is <b>${details.currencySymbol}${donationDetails.event.minDonation.toFixed(2)}</b>`

    for (const incentive of donationDetails.incentives) {
        let div = `
            <div class="incentiveListDiv" incentiveID=${incentive.id} onClick="showIncentiveInfo(this)">
                <div class="incentiveGame">${incentive.run.game}</div>
                <div class="incentiveName">${incentive.name}</div>
            </div>
            `
        document.querySelector('.incentiveList').innerHTML += div;
    }
    if (donationDetails.prizes.length <= 0) {
        document.querySelector('.prizesLabel').style.display = 'none';
        document.querySelector('#prizes').style.display = 'none';
    }
    for (const prize of donationDetails.prizes) {
        let div = `
            <div class="prizeListDiv" prizeID="${prize.id}" onClick="showPrize()">
                <p class="prizeName">${prize.name}</p>
                <p class="prizeAmount">${details.currencySymbol}${prize.minDonation.toFixed(2)} Minimim Donation</p>
            </div>
            `
        document.querySelector('.prizeList').innerHTML += div;
    }

    document.querySelector('.spinnerDiv').style.display = 'none'
    document.querySelector('main').style.display = 'inline-block'
}

async function donateForm() {
    let res = await fetch('/api/donation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData),
    })

    let donationInfo = await res.json();
    if (res.status !== 200) return console.error(donationInfo);

    document.body.insertAdjacentHTML("beforeend", `
        <form id="donateForm" action="${donationInfo.url}" method="post" target="_top">
            <input type="hidden" name="cmd" value="_donations" />
            <input type="hidden" name="image_url" value="${donationInfo.logo}">
            <input type="hidden" name="business" value="${donationInfo.payee}" />
            <input type="hidden" name="amount" value="${donationData.amount}" />
            <input type="hidden" name="currency_code" value="${details.currency}" />
            <input type="hidden" name="item_name" value="${donationInfo.event} Donation" />
            <input type="hidden" name="custom" value=${donationInfo.id} />
            <input type="hidden" name="notify_url" value="${window.location.origin}/api/donation/ipn" />
            <input type="hidden" name="return" value="${window.location.origin}/donate/success" />
            <input type="hidden" name="cancel_return" value="${window.location.origin}/donate/error" />
        </form>
    `);

    document.getElementById('donateForm').submit()
}

function updateAlias(element) {
    element.parentElement.querySelector('.inputCountCurrent').innerHTML = element.value.length;
    if (element.value.length <= 0) return donationData.alias = 'Anonymous';
    donationData.alias = element.value;
}

function updateEmail(element) {
    element.parentElement.querySelector('.inputCountCurrent').innerHTML = element.value.length;
    if (element.value.includes('@') && element.value.includes('.') && !element.value.includes(' ') && element.value.length > 0) donationData.email = element.value;
    else donationData.email = null;
    element.parentElement.querySelector(`.errorText`).style.visibility = 'hidden';
    checkStatus();
}

function updateEmailErrorText(element) {
    if (!element.value.includes('@') || !element.value.includes('.') || element.value.includes(' ')) element.parentElement.querySelector(`.errorText`).style.visibility = 'visible';
}

function updateAmount(element) {
    if (element.value === '' || element.value < donationDetails.event.minDonation) { donationData.amount = null; return checkStatus() };
    element.parentElement.querySelector(`.errorText`).style.visibility = 'hidden';
    donationData.amount = parseFloat(element.value)
    checkStatus();
}

function updateAmountErrorText(element) {
    if (element.value < donationDetails.event.minDonation && element.value !== '') element.parentElement.querySelector(`.errorText`).style.visibility = 'visible';
    if (document.querySelector('#email input').value === '') document.querySelector('#email .errorText').style.visibility = 'visible';
    element.value = parseFloat(element.value).toFixed(2);
    document.querySelector('.donateButtonAmount').innerHTML = details.currencySymbol + (parseFloat(element.value)).toFixed(2);
}

function updateComment(element) {
    element.parentElement.querySelector('.inputCountCurrent').innerHTML = element.value.length;
    if (element.value.length > 0) donationData.comment = element.value;
    else donationData.comment = '';
}

function checkStatus() {
    if (donationData.amount !== null) document.querySelector('#incentiveAdd').disabled = false;
    else document.querySelector('#incentiveAdd').disabled = true;
    if (donationData.email !== null && donationData.amount !== null) {
        document.querySelector('.donateButton').disabled = false;
        return;
    }
    else if (donationData.amount === null) document.querySelector('.donateButtonAmount').innerHTML = '';
    document.querySelector('.donateButton').disabled = true;
    return;
}

function checkIncentiveStatus() {
    if (selectedIncentive.id && selectedIncentive.amount) {
        if (selectedIncentive.type !== 'bidwar') document.querySelector('#incentiveAddConfirm').disabled = false;
        else if (selectedIncentive.option !== undefined && selectedIncentive.option !== null) document.querySelector('#incentiveAddConfirm').disabled = false;
        else if (selectedIncentive.userOption !== undefined && selectedIncentive.userOption !== null) document.querySelector('#incentiveAddConfirm').disabled = false;
    }
    else document.querySelector('#incentiveAddConfirm').disabled = true;
}

// Incentive logic.
function showIncentiveInfo(element) {
    const divs = document.querySelectorAll('.incentiveList .incentiveListDiv');
    for (const div of divs) { div.classList.remove('selected') }
    element.classList.add('selected');
    let incentive = donationDetails.incentives.find(x => x.id === element.getAttribute('incentiveid'))
    let info = document.querySelector('.incentiveInfo');
    selectedIncentive.id = element.getAttribute('incentiveid');
    selectedIncentive.type = incentive.type;
    calculateIncentiveAmountRemaining();
    info.querySelector('.incentiveGame').innerHTML = incentive.run.game;
    info.querySelector('.incentiveName').innerHTML = incentive.name;
    info.querySelector('.incentiveDescription').innerHTML = incentive.description;
    info.querySelector('.inputUnit').innerHTML = details.currencySymbol;
    info.querySelector('#incentiveAmount').style.paddingLeft = `${info.querySelector('.inputUnit').offsetWidth + 12}px`;
    if (incentive.type === 'target') {
        info.querySelector('.incentiveOptions').style.display = 'none';
        info.querySelector('.incentiveTotalProgressBar').style.width = `${(((100 * incentive.total) / incentive.goal) > 100) ? 100 : (100 * incentive.total) / incentive.goal}%`;
        info.querySelector('.incentiveTotal .incentiveTotalText').innerHTML = `Current Raised Amount: ${details.currencySymbol}${incentive.total.toFixed(2)} / ${details.currencySymbol}${incentive.goal.toFixed(2)}`
        info.querySelector('.incentiveTotal').style.display = 'inherit';
        info.querySelector('#incentiveAddConfirm').disabled = false;
    }
    else {
        info.querySelector('#incentiveAddConfirm').disabled = true;
        info.querySelector('.incentiveTotal').style.display = 'none';
        info.querySelector('.incentiveOptions').innerHTML = '';
        let incentiveOptions = incentive.options.sort((a, b) => { return b.total - a.total });
        for (const option of incentiveOptions) {
            let div = `
                <div class="incentiveOptionDiv" optionID=${option.id} onClick="selectIncentiveOption(this, false)">
                    <input type="checkbox" class="incentiveOptionCheck"></input>
                    <div class="incentiveOptionName">${option.name}</div>
                    <div class="incentiveOptionAmount">${details.currencySymbol}${option.total.toFixed(2)}</div>
                </div>
                `
            info.querySelector('.incentiveOptions').innerHTML += div;
        }
        if (incentive.allowUserOptions) {
            let div = `
            <div class="incentiveOptionDiv customOption" onClick="selectIncentiveOption(this, true)">
                <div class="flexbox">    
                    <input type="checkbox" class="incentiveOptionCheck" customOption="true"></input>
                    <div class="incentiveOptionName">Nominate a new option!</div>
                </div>
                <input type="input" class="incentiveCustomOption" maxLength="${(incentive.userOptionMaxLength) ? incentive.userOptionMaxLength : 160}" onInput="incentiveAddCustomOption(this)" disabled>
                <div class="inputCount">
                    <span class="inputCountCurrent">0</span>
                    <span class="inputCountMax">&nbsp/&nbsp${(incentive.userOptionMaxLength) ? incentive.userOptionMaxLength : 160}</span>
                </div>
            </div>
            `
            info.querySelector('.incentiveOptions').innerHTML += div;
        }
        info.querySelector('.incentiveOptions').style.display = 'inherit'
    }
    info.style.visibility = 'visible';
}

function addIncentiveAmount(element) {
    if (element.value === '' || element.value < 0.01) selectedIncentive.amount = null
    else if (parseFloat(element.value) > parseFloat(element.getAttribute('max'))) selectedIncentive.amount = parseFloat(element.getAttribute('max'))
    else selectedIncentive.amount = parseFloat(element.value)
    checkIncentiveStatus();
}

function checkIncentiveAmount(element) {
    if (parseFloat(element.value) > parseFloat(element.getAttribute('max'))) element.value = parseFloat(element.getAttribute('max')).toFixed(2);
    element.value = parseFloat(element.value).toFixed(2);
}

function selectIncentiveOption(element, custom) {
    if (element.querySelector('.incentiveOptionCheck').checked) return;
    for (const div of element.parentElement.querySelectorAll('.incentiveOptionDiv')) {
        div.classList.remove('selected');
        div.querySelector('.incentiveOptionCheck').checked = false;
    }
    try { element.parentElement.querySelector('.incentiveCustomOption').disabled = true } catch { };
    selectedIncentive.option = element.getAttribute('optionid');
    if (custom) element.querySelector('.incentiveCustomOption').disabled = false;
    element.querySelector('.incentiveOptionCheck').checked = true;
    element.classList.add('selected')
    checkIncentiveStatus();
}

function incentiveAddCustomOption(element) {
    element.parentElement.querySelector('.inputCountCurrent').innerHTML = element.value.length;
    if (element.value.length > 0) selectedIncentive.userOption = element.value;
    checkIncentiveStatus();
}

function addIncentive() {
    delete selectedIncentive.type;
    let index = donationData.incentives.findIndex(x => x.id === selectedIncentive.id);
    if (index > -1) {
        selectedIncentive.amount += donationData.incentives[index].amount;
        donationData.incentives[index] = selectedIncentive;
    }
    else donationData.incentives.push(selectedIncentive);
    selectedIncentive = {};
    document.querySelector('.incentiveDiv').style.display = 'none';
    document.querySelector('#incentiveAdd').style.display = 'inherit';
    document.querySelector('.incentiveErrorText').style.display = 'none';
    updateSelectedIncentives();
}

function showIncentiveMenu(button) {
    for (const div of button.parentElement.querySelectorAll('.incentiveListDiv')) {
        div.classList.remove('selected')
    }
    document.querySelector('.incentiveInfo').style.visibility = 'hidden'
    button.style.display = 'none';
    document.querySelector('.incentiveDiv').style.display = 'flex';
    document.querySelector('.incentiveErrorText').style.display = 'inherit';
}

function updateSelectedIncentives() {
    let incentiveDiv = document.querySelector('.incentiveSelected');
    incentiveDiv.innerHTML = '';
    for (const incentive of donationData.incentives) {
        let info = donationDetails.incentives.find(x => x.id === incentive.id);
        let option = '&nbsp';
        if (incentive.option !== undefined && incentive.option !== null) try { option = `Option: ${info.options.find(x => x.id === incentive.option).name}` } catch { option = '&nbsp' }
        else if (incentive.userOption !== undefined) option = `Option: ${incentive.userOption}`;
        let div = `
            <div class="incentiveSelectedDiv">
                <div class="incentiveSelectedLeftDiv">
                    <div class="incentiveGame">${info.run.game}</div>
                    <div class="incentiveName">${info.name}</div>
                    <div class="incentiveOption">${option}</div>
                </div>
                <div class="incentiveSelectedRightDiv">
                    <div class="incentiveAmount">${details.currencySymbol}${parseFloat(incentive.amount).toFixed(2)}</div>
                    <button type="button" class="incentiveSelectedRemove" onClick="removeIncentive('${info.id}')">Remove</button>
                </div>
            </div>
        `

        incentiveDiv.innerHTML += div;
    }
    if (Math.abs(donationData.incentives.reduce((sum, x) => sum - x.amount, 0)) >= donationData.amount) return document.querySelector('#incentiveAdd').style.display = 'none';
    else if (donationData.incentives.length > 0) document.querySelector('#incentiveAdd').innerHTML = 'Add Another Incentive';
    else document.querySelector('#incentiveAdd').innerHTML = 'Add Incentives'
    document.querySelector('#incentiveAdd').style.display = 'inherit';
}

function calculateIncentiveAmountRemaining() {
    let amount = parseFloat(document.querySelector('#amount input').value);
    if (donationData.incentives.length > 0) amount += donationData.incentives.reduce((sum, x) => sum - x.amount, 0);
    let input = document.querySelector('.incentiveInfo #incentiveAmount');
    input.value = amount.toFixed(2);
    input.setAttribute('max', amount);
    document.querySelector('.incentiveInfo .inputSubtext').innerHTML = `You have <b>${details.currencySymbol}${parseFloat(amount).toFixed(2)}</b> remaining.`;
    addIncentiveAmount(input)
}

function removeIncentive(id) {
    donationData.incentives.splice(donationData.incentives.indexOf(x => x.id === id), 1);
    updateSelectedIncentives();
    calculateIncentiveAmountRemaining();
}

function showPrize() {
    return;
}

function updateCounter(element) {
    element.parentElement.querySelector('.inputCountCurrent').innerHTML = element.value.length;
}
