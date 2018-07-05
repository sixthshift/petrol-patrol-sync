const _ = require('lodash');

/**
 * Assigns the MongoDB internal id property to an object
 * 
 * @param {string} documentID The id value to apply
 * @param {object} document The object to apply the internal id to
 * @returns {object} A new object with the MongoDB internal id assigned
 */
const assignInternalID = (documentID, document) => {
    return _.assign({}, document, { _id: documentID });
};

/**
 * Constructs a MongoDB URI based on credential configurations
 * 
 * @param {object} credentials 
 * @returns {string} The MongoDB URI
 */
const buildUri = (credentials) => {
    return 'mongodb://' + credentials.username + ':' + credentials.password + '@' + credentials.url + '/' + credentials.db;
};

/**
 * Omits the MongoDB internal id property from an object
 * 
 * @param {object} object The object to omit the internal id from
 * @returns {object} A new object with the MongoDB internal id omitted
 */
const omitInternalID = (object) => {
    return _.omit(object, '_id');
}

module.exports = {
    assignInternalID,
    buildUri,
    omitInternalID,
};