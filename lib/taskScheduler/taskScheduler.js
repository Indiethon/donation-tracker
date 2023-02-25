const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
let tracker, database;

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.start = () => {

    const checkIncentiveExpiryTimeTask = new Task(
        'checkIncentiveExpiryTime',
        () => {
            database.models['event'].findOne({ active: true }), (eventErr, eventData) => {
                database.models['incentive'].updateMany({ eventId: eventData._id, active: true, endTime: { $lt: new Date() } }, { active: false }, (err, data) => {
                    if (err) console.error(err)
                });
                database.models['incentive'].updateMany({ eventId: eventData._id, active: false, startTime: { $lt: new Date() } }, { active: true }, (err, data) => {
                    if (err) console.error(err)
                });
            }
        }
    )

    const checkPrizeExpiryTimeTask = new Task(
        'checkPrizeExpiryTime',
        () => {
            database.models['prizeRedemption'].updateMany({ $and: [{status: 'pending'}, { expiryTimestamp: { $lt: new Date() } }]}, { status: 'expired' }, (err, data) => {
                if (err) console.error(err)
            });
        }
    )

    const scheduler = new ToadScheduler();

    const updateIncentiveTime = new SimpleIntervalJob({ minutes: 1, }, checkIncentiveExpiryTimeTask)
    const checkPrizeExpiryTime = new SimpleIntervalJob({ minutes: 1 }, checkPrizeExpiryTimeTask)

    scheduler.addSimpleIntervalJob(updateIncentiveTime);
    scheduler.addSimpleIntervalJob(checkPrizeExpiryTime);
}