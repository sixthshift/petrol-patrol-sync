const _ = require('lodash');
const constants = require('../../constants');
const time = require('../../util/time');

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
 * Encodes a latitude and longitude tuple into a geohash
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {string} A geohash value encoding the latitude and longitude values
 */
const encodeGeohash = (latitude, longitude) => {
    const charset = "0123456789bcdefghjkmnpqrstuvwxyz";
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
            hash += charset[bits];
            bits = 0;
        }
    }
    return hash;
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
        "postcode": splitAddress[4]
    }
};

module.exports = {
    encodeBase64,
    encodeGeohash,
    splitAddress,
};