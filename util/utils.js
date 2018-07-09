const _ = require('lodash');
const constants = require('../constants');
const crypto = require('crypto');
const time = require('./time');

/**
 * Returns an object with the 'active' property set to false
 * 
 * @param {object} object An object that is to be disabled
 * @returns {object} An object with the active property set to false
 */
const deactivate = (object) => {
    return _.update(object, 'active', () => { return false });
};

/**
 * Determines the left outer join difference between the toInspect and toExclude arrays 
 * 
 * @param {[object]} toInspect The array to inspect elements against
 * @param {[object]} toExclude The array to exclude elements against
 * @returns {[object]} An array containing the remainder of the toInspect array after subtracting the toExclude array
 */
const difference = (toInspect, toExclude) => {
    return _.differenceWith(toInspect, toExclude, _.isEqual);
};

/**
 * Returns an empty promise object
 * 
 * @param {*} val A value to return upon resolving the promise
 * @returns {*} A promise that will resolve to the inputted value
 */
const emptyPromise = (val = null) => {
    return new Promise((resolve) => { resolve(val); });
};

/**
 * Generates an md5 hash from the input
 * 
 * @param {object} data The data to be hashed
 * @returns {string} The hash value of the input
 */
const hash = (data) => {
    const dataString = JSON.stringify(data);
    let md5sum = crypto.createHash('md5');
    md5sum.update(dataString);
    return md5sum.digest('hex');
};

/**
 * Determines whether a given object is active or not,
 * if the 'active' property does not exist then it is assumed active
 * 
 * @param {object} object
 * @returns {boolean}
 */
const isActive = (object) => {
    if (_.has(object, 'active')) {
        return object.active === true;
    } else {
        return true;
    }
};

/**
 * Determines whether a sync function has successfully run or not
 * 
 * @param {object} result The result object that is returned from a sync function
 * @returns {boolean}
 */
const isError = (result) => {
    try {
        return result.status == false;
    } catch (error) {
        return true;
    }
};

/**
 * Determines whether a given price is older than {constants.expiredThreshold} days ago
 * 
 * @param {string} thenTime 
 * @returns {boolean}
 */
const isExpired = (price) => {
    const then = time.parseUnix(price.time);
    const now = time.now();
    return time.diff(then, now) >= constants.expiredThreshold;
};

/**
 * Determines whether a given timestamp is older than {constants.staleThreshold} days ago
 * 
 * @param {object} price 
 * @returns {boolean}
 */
const isStale = (price) => {
    const then = (_.has(price, 'lastupdated')) ?
        time.parseTimestamp(price.lastupdated) :
        time.parseUnix(price.time);
    const now = time.now();
    return time.diff(then, now) >= constants.staleThreshold;
};

/**
 * Sanitises an id value
 * 
 * @param {string} id The value to be sanitised
 * @returns {string} The sanitised input
 */
const sanitiseID = (id) => {
    return _.replace(id.toString(), /\//, '').toString();
};

module.exports = {
    deactivate,
    difference,
    emptyPromise,
    hash,
    isActive,
    isError,
    isExpired,
    isStale,
    sanitiseID,
};