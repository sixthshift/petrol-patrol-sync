const _ = require('lodash');
const constants = require('../../constants');
const jsonfile = require('jsonfile');
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
 * Reads a JSON file at the given path
 * Throws an error if JSON file does not exist at the given path
 * 
 * @param {string} path The file path to read from
 * @returns {object} The JSON file as an object
 */
const readJSON = (path) => {
    return jsonfile.readFileSync(path);
}

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

/**
 * Writes an object as JSON at the given path
 * 
 * @param {*} path The file path to write the object to
 * @param {*} obj The object to be written
 */
const writeJSON = (path, obj) => {
    jsonfile.writeFileSync(path, obj, { spaces: 4 });
}

module.exports = {
    accessTokenExpired,
    encodeBase64,
    encodeGeohash,
    readJSON,
    splitAddress,
    writeJSON,
};