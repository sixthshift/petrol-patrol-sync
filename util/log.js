const time = require('./time');
const _ = require('lodash');

const logFormatString = 'YYYY-MM-DD HH:mm:ss.SSSS';

/**
 * Base logging wrapper function over console.log
 * 
 * @param {string} logger The logger object that will write the log message
 * @param {string} level The log level
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const log = (logger, level, message) => {
    const logNow = time.now().format(logFormatString);
    const logLevel = _.padStart(level, 5, ' ');
    const log = logNow + ' ' + logLevel + ' - ' + message;
    logger(log);
    return log;
};

/**
 * The info log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const info = (message) => {
    return log(console.info, 'info', message);
};

/**
 * The warn log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const warn = (message) => {
    return log(console.warn, 'warn', message);
};

/**
 * The error log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const error = (message) => {
    return log(console.error, 'error', message);
};

/**
 * The debug log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const debug = (message) => {
    return log(console.debug, 'debug', message);
};

/**
 * The trace log function
 * 
 * @param {string} message The log message
 * @returns {string} The log message that is written
 */
const trace = (message) => {
    return log(console.trace, 'trace', message);
};

module.exports = {
    info,
    warn,
    error,
    debug,
    trace,
}