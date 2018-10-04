const _ = require('lodash');
const utils = require('./utils');

module.exports = (prices) => {
    if (_.size(prices) == 1) {
        return 0;
    }
    let mean = 0;
    let sum = 0;
    _(prices).forEach((iteratee, index) => {
        const price = utils.getPrice(iteratee);
        const oldMean = mean;
        mean = mean + (price - mean) / (index + 1);
        sum = sum + (price - mean) * (price - oldMean);
    });
    const variance = sum / (_.size(prices) - 1);
    return Math.sqrt(variance);
};