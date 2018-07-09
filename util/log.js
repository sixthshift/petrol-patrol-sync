const _ = require('lodash');

const logFormatString = 'YYYY-MM-DD HH:mm:ss.SSSS';

/**
 * Base logging wrapper function over console.log
 * 
 * @param {string} logger The logger object that will write the log message
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const log = (logger, message) => {
    logger(message);
    return message;
};

/**
 * The info log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const info = (message) => {
    return log(console.info, message);
};

/**
 * The warn log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const warn = (message) => {
    return log(console.warn, message);
};

/**
 * The error log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const error = (message) => {
    return log(console.error, message);
};

/**
 * The debug log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const debug = (message) => {
    return log(console.debug, message);
};

/**
 * The trace log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const trace = (message) => {
    return log(console.trace, message);
};

module.exports = {
    info,
    warn,
    error,
    debug,
    trace,
}