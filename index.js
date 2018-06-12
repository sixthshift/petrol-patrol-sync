#!/usr/bin/node

const FuelCheck = require('./api/fuelcheck/fuelcheck');
const fuelcheckCredentials = require('./api/fuelcheck/fuelcheck-credentials');

main = async () => {
    const fuelcheck = new FuelCheck();
    await fuelcheck.init(fuelcheckCredentials.key, fuelcheckCredentials.secret);
};

main();