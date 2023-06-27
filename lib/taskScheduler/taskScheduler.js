const cron = require('node-cron');
const serverEvents = require('../serverEvents/serverEvents');
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.start = () => {

    cron.schedule('* * * * *', async () => {
        let event = await database.findOne('event', { active: true });
        if (!event) return;
        checkRunStartTime(event);
        checkIncentiveExpiryTime(event);
    });

    async function checkRunStartTime(event) {
        let runs = await database.find('run', { eventId: event._id });
        let array = runs.sort((a, b) => { return new Date(a.startTime) - new Date(b.startTime) })
        for (let i = 0; i < array.length; i++) {
            if (i + 1 >= array.length) return;
            let dateA, dateB;
            dateA = new Date(array[i].startTime);
            dateB = new Date(array[i + 1].startTime);
            now = new Date();
            if (dateA <= now && dateB > now) {
                let runData = {
                    currentRun: array[i]._id,
                    delay: 0,
                    auto: false
                }
                database.setCache('currentRun', runData);
                serverEvents.sendRunEvent({
                    currentRun: runData.currentRun,
                    delay: 0
                })
                break;
            }
        }
    }

    async function checkIncentiveExpiryTime(event) {
        let incentives = await database.find('incentive', { eventId: event._id, active: true });
        let timeNow = new Date();
        for (let i = 0; i < incentives.length; i++) {
            let endTime = new Date(incentives[i].endTime);
            if (timeNow > endTime) {
                await database.update('incentive', { _id: incentives[i]._id, }, { active: false })
            }
        }
    }

    // const checkIncentiveExpiryTimeTask = new Task(
    //     'checkIncentiveExpiryTime',
    //     () => {
    //         database.models['event'].findOne({ active: true }), (eventErr, eventData) => {
    //             database.models['incentive'].updateMany({ eventId: eventData._id, active: true, endTime: { $lt: new Date() } }, { active: false }, (err, data) => {
    //                 if (err) console.error(err)
    //             });
    //             database.models['incentive'].updateMany({ eventId: eventData._id, active: false, startTime: { $lt: new Date() } }, { active: true }, (err, data) => {
    //                 if (err) console.error(err)
    //             });
    //         }
    //     }
    // )

    // const checkPrizeExpiryTimeTask = new Task(
    //     'checkPrizeExpiryTime',
    //     () => {
    //         database.models['prizeRedemption'].updateMany({ $and: [{status: 'pending'}, { expiryTimestamp: { $lt: new Date() } }]}, { status: 'expired' }, (err, data) => {
    //             if (err) console.error(err)
    //         });
    //     }
    // )

    // const checkCurrentRunStartTimeTask = new AsyncTask(
    //     'checkCurrentRunStartTimeTask',
    //     () => {
    //         database.findOne('event', { active: true }).then((event) => {
    //             console.log(event._id)
    //             let runs = database.findAll('run', { eventId: event._id });
    //             console.log(runs[0])
    //             database.findAll('run', { eventId: event._id }).then((runs) => {
    //                 let array = array.sort((a, b) => { return new Date(b.startTime) - new Date(a.startTime) })
    //                 for (let i = 0; i < runs.length; i++) {
    //                     let dateA = runs[i].startTime;
    //                     let dateB = runs[i + 1].startTime;
    //                     if (dateA < Date.now() && dateB > Date.now()) {
    //                         let runData = {
    //                             currentRun: runs[i]._id,
    //                             nextRun: runs[i + 1]._id,
    //                             delay: 0,
    //                             auto: false
    //                         }
    //                         database.setCache('currentRun', runData);
    //                         serverEvents.sendRunEvent({
    //                             currentRun: runData.currentRun,
    //                             delay: 0
    //                         })
    //                         break;
    //                     }
    //                 }              
    //             }).catch(e => console.error(e));
    //         })
    //     }
    // )

    // const scheduler = new ToadScheduler();

    // const updateIncentiveTime = new SimpleIntervalJob({ minutes: 1, }, checkIncentiveExpiryTimeTask)
    // const checkPrizeExpiryTime = new SimpleIntervalJob({ minutes: 1 }, checkPrizeExpiryTimeTask)
    // const checkCurrentRunStartTimeTime = new SimpleIntervalJob({ seconds: 10}, checkCurrentRunStartTimeTask)

    // // scheduler.addSimpleIntervalJob(updateIncentiveTime);
    // // scheduler.addSimpleIntervalJob(checkPrizeExpiryTime);
    // scheduler.addSimpleIntervalJob(checkCurrentRunStartTimeTime)
}