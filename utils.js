const _ = require('lodash');
const crypto = require('crypto');

module.exports = {

    deactivate: (object) => {
        return _.update(object, 'active', () => { return false });
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