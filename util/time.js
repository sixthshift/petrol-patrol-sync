const _ = require('lodash');
const moment = require('moment');

const formatString = 'DD/MM/YYYY hh:mm:ss A';

/**
 * Determines the time difference in days between two moment objects
 * 
 * @param {moment} start A moment object representing the start of the time range
 * @param {moment} end A moment object representing the end of the time range
 * @returns {number} The time difference in days
 */
const diff = (start, end) => {
    return end.diff(start, 'days');
};

/**
 * Fetches a moment object representing epoch time
 * 
 * @returns {moment} A moment object representing epoch time
 */
const epoch = () => {
    return moment(0);
};

/**
 * Fetches a moment object representing current time
 * 
 * @returns {moment} A moment object representing current time
 */
const now = () => {
    return moment();
};

/**
 * Parses a string-based timestamp into a moment object representing the same time
 * 
 * @param {string} timestamp String-based timestamp
 * @returns {moment} A moment object representing the same time as the string-based timestamp
 */
const parseTimestamp = (timestamp) => {
    return moment(timestamp, formatString);
};

/**
 * Parses a integer-based unix time into a moment object representing the same time
 * 
 * @param {string} unixTimeInSeconds Unix time since epoch in seconds
 * @returns {moment} A moment object representing the same time as the unix time
 */
const parseUnix = (unixTimeInSeconds) => {
    return moment(unixTimeInSeconds * 1000);
};

module.exports = {
    diff,
    epoch,
    now,
    parseTimestamp,
    parseUnix,
}