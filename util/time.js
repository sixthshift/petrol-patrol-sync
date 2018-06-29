const _ = require('lodash');
const moment = require('moment');

module.exports = {
    formatString: 'DD/MM/YYYY hh:mm:ss A',
    epoch() {
        return moment(0);
    },
    now() {
        return moment();
    },
    parseTimestamp(timestamp) {
        return moment(timestamp, module.exports.formatString);
    },
    parseUnix(unixTimeInSeconds) {
        return moment(unixTimeInSeconds * 1000);
    },
    diff(start, end) {
        return end.diff(start, 'days');
    },
}