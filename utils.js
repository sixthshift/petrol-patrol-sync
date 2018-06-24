const _ = require('lodash');
const crypto = require('crypto');

module.exports = {
    currentTimestamp: () => {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        if (month.toString().length == 1) {
            var month = '0' + month;
        }
        if (day.toString().length == 1) {
            var day = '0' + day;
        }
        if (hour.toString().length == 1) {
            var hour = '0' + hour;
        }
        if (minute.toString().length == 1) {
            var minute = '0' + minute;
        }
        if (second.toString().length == 1) {
            var second = '0' + second;
        }

        var dateTime = day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second;
        return dateTime;
    },
    deactivate: (object) => {
        const returnFalse = () => { return false; }
        return _.update(object, 'active', returnFalse);
    },
    difference: (toInspect, toExclude) => {
        return _.differenceWith(toInspect, toExclude, _.isEqual);
    },
    hash: (data) => {
        let dataString = JSON.stringify(data);
        let md5sum = crypto.createHash('md5');
        md5sum.update(dataString);
        return md5sum.digest('hex');
    },
    sanitiseID: (id) => {
        return _.replace(id.toString(), /\//, '').toString();
    },
    splitAddress: (address) => {
        let splitAddress = address.split(/(,| NSW )/);
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