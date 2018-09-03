const _ = require('lodash');

/**
 * Gets the prices from a price object
 * 
 * @param {object} price The price object
 * @returns {number} The price
 */
const getPrice = (price) => {
    return _.get(price, 'price', 0);
};

module.exports = {
    getPrice,
};