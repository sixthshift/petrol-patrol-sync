const _ = require('lodash');
const crypto = require('crypto');

module.exports = {
    currentTimestamp: () => {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();

        month = _.padStart(month, 2, '0');
        day = _.padStart(day, 2, '0');
        hour = _.padStart(hour, 2, '0');
        minute = _.padStart(minute, 2, '0');
        second = _.padStart(second, 2, '0');

        return day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second;
    },
    deactivate: (object) => {
        return _.update(object, 'active', _.stubFalse());
    },
    difference: (toInspect, toExclude) => {
        return _.differenceWith(toInspect, toExclude, _.isEqual);
    },
    hash: (data) => {
        const dataString = JSON.stringify(data);
        let md5sum = crypto.createHash('md5');
        md5sum.update(dataString);
        return md5sum.digest('hex');
    },
    sanitiseID: (id) => {
        return _.replace(id.toString(), /\//, '').toString();
    },
    splitAddress: (address) => {
        const splitAddress = address.split(/(,| NSW | ACT )/);
        splitAddress = splitAddress.map((addressPortion) => {
            return addressPortion.trim();
        });

        return {
            "street": splitAddress[0],
            "suburb": splitAddress[2],
            "state": splitAddress[3],
            "postcode": splitAddress[4]
        }
    },
    toDateStamp: (timestamp) => {
        return timestamp.substr(0, timestamp.indexOf(' '));
    }
}