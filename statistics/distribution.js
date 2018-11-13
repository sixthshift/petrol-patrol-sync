const _ = require('lodash');
const utils = require('./utils');

const accumulate = (accumulator, iteratee) => {
    const price = _(utils.getPrice(iteratee)).floor();
    if (_.has(accumulator, price)) {
        accumulator[price] += 1;
    } else {
        accumulator[price] = 1;
    }
    return accumulator;
};

module.exports = (prices) => {
    return _.reduce(prices, accumulate, {});
};