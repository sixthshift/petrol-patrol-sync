const _ = require('lodash');

const time = require('../../util/time');

/**
 * Determines whether the access token has expired or not
 * 
 * @param {object} accessTokenJSON The access token object
 * @returns {boolean}
 */
const accessTokenExpired = (accessTokenJSON) => {
    const issueTime = time.parseUnix(_.toNumber(accessTokenJSON.issued_at));
    const duration = _.toNumber(accessTokenJSON.expires_in);
    const now = time.now();
    return time.diff(issueTime, now, 'seconds') >= duration;
}

/**
 * Generates a base64 encode of a key, secret pair
 * 
 * @param {string} key 
 * @param {string} secret 
 * @returns {string} The base64 encoded value
 */
const encodeBase64 = (key, secret) => {
    return Buffer.from(key + ':' + secret).toString('base64');
};


/**
 * Splits a composite address string into its components
 * 
 * @param {string} address The address string to be split
 * @returns {object} An object containing the components of the address string
 */
const splitAddress = (address) => {
    let splitAddress = address.split(/(,| NSW | ACT )/);
    splitAddress = splitAddress.map((addressPortion) => {
        return addressPortion.trim();
    });

    return {
        "street": splitAddress[0],
        "suburb": splitAddress[2],
        "state": splitAddress[3],
        "postcode": _(splitAddress[4]).toNumber(),
    }
};


module.exports = {
    accessTokenExpired,
    encodeBase64,
    splitAddress,
};