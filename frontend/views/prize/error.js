export default class {
    constructor(event) {

        this.events = {
            async getPreMain() {
                return `
                <div class="checkmarkDiv">
                    <div class="checkmark wrapper"> <svg class="cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="cross__circle" cx="26" cy="26" r="25" fill="none" />
                        <path class="cross__check" fill="none" d="M16 16 36 36 M36 16 16 36" />
                      </svg>
                    </div>
                    <div class="successText">Your prize couldn't be claimed.</div>
                    <div class="errorMessage"></div>
                </div>

            <style>
    html {
        height: 100%;
    }
   .body {
        height: calc(100vh - 385px);
    }
    .content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    
    .footer {
        position: fixed;
        left: 0;
        bottom: 0;
        height: 50px;
        width: 100%;
        color: black;
        text-align: center;
        opacity: 0;
        transition-duration: 2s;
        font-size: 16px;
    }
</style>`
            },

            async runFunction(details) {
                document.querySelector('.errorMessage').innerHTML = details.prizeErrorMessage;
                setTimeout(() => {
                    document.querySelector('.successText').style.opacity = '1';
                    setTimeout(() => { document.querySelector('.errorMessage').style.opacity = '1'; document.querySelector('.footer').style.opacity = '1' }, 1250);
                }, 2000)
                return;
            },

            async getFooter() {
                return `    <div class="footer">
                <div>It is now safe to close this window.</div>
            </div>`
            }
        }
    }
}