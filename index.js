#!/usr/bin/node

const _ = require('lodash');
const utils = require('./utils');

const FuelCheck = require('./api/fuelcheck/fuelcheck');
const MongoDB = require('./api/mongodb/mongodb');
const Database = require('./api/firebase/database');
const FireStore = require('./api/firebase/firestore');

// Credentials need to be retrieved from the corresponding Api services.
const firebaseCredentials = require('./api/firebase/firebase-credentials');
const fuelcheckCredentials = require('./api/fuelcheck/fuelcheck-credentials');
const mongodbCredentials = require('./api/mongodb/mongodb-credentials');

syncBrands = async (fuelcheck, database) => {

    const databaseBrands = database.brands();
    const fuelcheckBrands = fuelcheck.brands();

    const toBeEnabled = utils.difference(fuelcheckBrands, databaseBrands);
    const toBeDisabled = utils.difference(databaseBrands, fuelcheckBrands)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (deactivated) => {
        promises.push(database.setBrand(deactivated));
    });

    _.each(toBeEnabled, (activated) => {
        promises.push(database.setBrand(activated));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncFueltypes = async (fuelcheck, database) => {

    const databaseFueltypes = database.fueltypes();
    const fuelcheckFueltypes = fuelcheck.fueltypes();

    const toBeEnabled = utils.difference(fuelcheckFueltypes, databaseFueltypes);
    const toBeDisabled = utils.difference(databaseFueltypes, fuelcheckFueltypes)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (deactivated) => {
        promises.push(database.setFueltype(deactivated));
    });

    _.each(toBeEnabled, (activated) => {
        promises.push(database.setFueltype(activated));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncStations = async (fuelcheck, database) => {

    const databaseStations = database.stations();
    const fuelcheckStations = fuelcheck.stations();

    const toBeEnabled = utils.difference(fuelcheckStations, databaseStations);
    const toBeDisabled = utils.difference(databaseStations, fuelcheckStations)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDisabled, (deactivated) => {
        promises.push(database.setStation(deactivated));
    });

    _.each(toBeEnabled, (activated) => {
        promises.push(database.setStation(activated));
    });

    await Promise.all(promises);

    return {
        enabled: toBeEnabled,
        disabled: toBeDisabled
    };
};

syncPrices = async (fuelcheck, database) => {

    const databasePrices = database.prices();
    const fuelcheckPrices = fuelcheck.prices();

    const toBeUpdated = utils.difference(fuelcheckPrices, databasePrices);
    const notUpdated = utils.difference(fuelcheckPrices, toBeUpdated);
    // const toBeStale = _.map(notUpdated, (obj) => { });

    let promises = [];
    _.each(toBeUpdated, (activated) => {
        promises.push(database.setPrice(activated));
    });

    await Promise.all(promises);

    return {
        toBeUpdated: toBeUpdated,
        notUpdated: notUpdated
    };
}

isPriceStale = (price) => {
    priceTimestamp = utils.decomposeTimestamp(price.timestamp);
}

isError = (result) => {
    try {
        return result.status == false;
    } catch (error) {
        return true;
    }
};

main = async () => {

    let initialisationPromises = [];

    const fuelcheck = new FuelCheck();
    initialisationPromises.push(fuelcheck.init(fuelcheckCredentials));

    // const database = new Database();
    // database.init(firebaseCredentials);

    const mongodb = new MongoDB();
    initialisationPromises.push(mongodb.init(mongodbCredentials));

    // const firestore = new FireStore();
    // initialisationPromises.push(firestore.init(firebaseCredentials));

    const initialisationResults = await Promise.all(initialisationPromises);
    const initialisationErrors = _.filter(initialisationResults, isError);
    if (!_.isEmpty(initialisationErrors)) {
        console.error(initialisationErrors);
    }

    const syncPromises = [];

    syncPromises.push(syncBrands(fuelcheck, mongodb));
    syncPromises.push(syncFueltypes(fuelcheck, mongodb));
    syncPromises.push(syncStations(fuelcheck, mongodb));
    syncPromises.push(syncPrices(fuelcheck, mongodb));

    const syncResults = await Promise.all(syncPromises);
    console.log(JSON.stringify(syncResults));
};

main().then(() => {
    process.exit();
});