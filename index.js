#!/usr/bin/node

const _ = require('lodash');
const constants = require('./constants');
const time = require('./util/time');
const utils = require('./utils');

const FireDB = require('./api/firebase/firedb');
const FuelCheck = require('./api/fuelcheck/fuelcheck');
const MongoDB = require('./api/mongodb/mongodb');

// Credentials need to be retrieved from the corresponding Api services.
const firebaseCredentials = require('./api/firebase/firebase-credentials');
const fuelcheckCredentials = require('./api/fuelcheck/fuelcheck-credentials');
const mongodbCredentials = require('./api/mongodb/mongodb-credentials');

isExpired = (price) => {
    const then = time.parseUnix(price.time);
    const now = time.now();
    return time.diff(then, now) >= constants.expiredThreshold;
}

agePrice = (price) => {
    return _.set(price, 'stale', isStale(price));
};

isError = (result) => {
    try {
        return result.status == false;
    } catch (error) {
        return true;
    }
};

syncBrands = async (fuelcheck, database, firedb) => {

    const databaseBrands = database.brands();
    const fuelcheckBrands = fuelcheck.brands();

    const toBeEnabled = utils.difference(fuelcheckBrands, databaseBrands);
    const toBeDisabled = utils.difference(databaseBrands, fuelcheckBrands)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (disabled) => {
        promises.push(database.setBrand(disabled));
        promises.push(firedb.setBrand(disabled));
    });

    _.each(toBeEnabled, (enabled) => {
        promises.push(database.setBrand(enabled));
        promises.push(firedb.setBrand(enabled));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncFueltypes = async (fuelcheck, database, firedb) => {

    const databaseFueltypes = database.fueltypes();
    const fuelcheckFueltypes = fuelcheck.fueltypes();

    const toBeEnabled = utils.difference(fuelcheckFueltypes, databaseFueltypes);
    const toBeDisabled = utils.difference(databaseFueltypes, fuelcheckFueltypes)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (disabled) => {
        promises.push(database.setFueltype(disabled));
        promises.push(firedb.setFueltype(disabled));
    });

    _.each(toBeEnabled, (enabled) => {
        promises.push(database.setFueltype(enabled));
        promises.push(firedb.setFueltype(enabled));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncStations = async (fuelcheck, database, firedb) => {

    const databaseStations = database.stations();
    const fuelcheckStations = fuelcheck.stations();

    const toBeEnabled = utils.difference(fuelcheckStations, databaseStations);
    const toBeDisabled = utils.difference(databaseStations, fuelcheckStations)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (disabled) => {
        promises.push(database.setStation(disabled));
        promises.push(firedb.setStation(disabled));
    });

    _.each(toBeEnabled, (enabled) => {
        promises.push(database.setStation(enabled));
        promises.push(firedb.setStation(enabled));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncPrices = async (fuelcheck, database, firedb) => {

    const databasePrices = database.prices();
    const fuelcheckPrices = fuelcheck.prices();

    let toBeUpdated = utils.difference(fuelcheckPrices, databasePrices);
    let toBePreserved = utils.difference(databasePrices, toBeUpdated);
    let toBeExpired = _.union(toBeUpdated, toBePreserved).filter(isExpired);

    let promises = [];

    _.each(toBeUpdated, (updated) => {
        promises.push(database.setPrice(updated));
        promises.push(firedb.setPrice(updated));
    });

    _.each(toBeExpired, (expired) => {
        promises.push(database.unsetPrice(expired));
        promises.push(firedb.unsetPrice(expired));
    });

    await Promise.all(promises);

    return {
        toBeUpdated: toBeUpdated,
        toBeExpired: toBeExpired
    };
}

main = async () => {

    let initialisationPromises = [];

    const fuelcheck = new FuelCheck();
    initialisationPromises.push(fuelcheck.init(fuelcheckCredentials));

    const mongodb = new MongoDB();
    initialisationPromises.push(mongodb.init(mongodbCredentials));

    const firedb = new FireDB();
    initialisationPromises.push(firedb.init(firebaseCredentials));

    const initialisationResults = await Promise.all(initialisationPromises);
    const initialisationErrors = _.filter(initialisationResults, isError);
    if (!_.isEmpty(initialisationErrors)) {
        console.error(initialisationErrors);
    }

    const syncPromises = [];

    syncPromises.push(syncBrands(fuelcheck, mongodb, firedb));
    syncPromises.push(syncFueltypes(fuelcheck, mongodb, firedb));
    syncPromises.push(syncStations(fuelcheck, mongodb, firedb));
    syncPromises.push(syncPrices(fuelcheck, mongodb, firedb));

    const syncResults = await Promise.all(syncPromises);
    console.log(JSON.stringify(syncResults, null, 2));
};

main().then(() => {
    process.exit();
});