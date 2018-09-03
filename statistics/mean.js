const _ = require('lodash');
const utils = require('./utils');

module.exports = (prices) => {
    return _.meanBy(prices, utils.getPrice);
}