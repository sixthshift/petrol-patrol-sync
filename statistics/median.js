const _ = require('lodash');
const utils = require('./utils');

module.exports = (prices) => {
    const sorted = _.sortBy(prices, 'price');
    const count = sorted.length;
    const even = count % 2 == 0;
    const medianIndex = (count - 1) / 2;
    if (even) {
        const medianIndexFloor = _.floor(medianIndex);
        const medianIndexCeil = _.ceil(medianIndex);
        const medianPriceFloor = utils.getPrice(sorted[medianIndexFloor]);
        const medianPriceCeil = utils.getPrice(sorted[medianIndexCeil]);
        return _.mean([medianPriceFloor, medianPriceCeil]);
    } else {
        return utils.getPrice(sorted[medianIndex]);
    }
}