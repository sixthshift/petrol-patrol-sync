const _ = require('lodash');
const utils = require('./utils');

module.exports = (prices) => {
    return utils.getPrice(_.minBy(prices, utils.getPrice));
};