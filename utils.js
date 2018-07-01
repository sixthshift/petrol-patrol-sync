const _ = require('lodash');
const constants = require('./constants');
const crypto = require('crypto');

module.exports = {
    deactivate: (object) => {
        return _.update(object, 'active', () => { return false });
    },
    difference: (toInspect, toExclude) => {
        return _.differenceWith(toInspect, toExclude, _.isEqual);
    },
    emptyPromise: (val = null) => {
        return new Promise((resolve) => { resolve(val); });
    },
    geoEncode: (latitude, longitude) => {
        let hash = '';
        let bits = 0;
        let numBits = 0;
        const latitudeRange = {
            min: -90,
            max: 90
        };
        const longitudeRange = {
            min: -180,
            max: 180
        };
        let alternate = false;
        while (hash.length < constants.geohashPrecision) {
            const latOrLng = alternate ? latitude : longitude;
            const range = alternate ? latitudeRange : longitudeRange;
            const midRange = (range.min + range.max) / 2;
            if (latOrLng > midRange) {
                bits = (bits << 1) + 1;
                range.min = midRange;
            } else {
                bits = (bits << 1) + 0;
                range.max = midRange;
            }
            alternate = !alternate;
            if (numBits < 4) {
                numBits++;
            } else {
                numBits = 0;
                hash += constants.geohashCharset[bits];
                bits = 0;
            }
        }
        return hash;
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
        let splitAddress = address.split(/(,| NSW | ACT )/);
        splitAddress = splitAddress.map((addressPortion) => {
            return addressPortion.trim();
        });

        return {
            "street": splitAddress[0],
            "suburb": splitAddress[2],
            "state": splitAddress[3],
            "postcode": splitAddress[4]
        }
    }
}