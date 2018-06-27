#!/usr/bin/node

const _ = require('lodash');
const utils = require('./utils');

const Database = require('./api/firebase/database');
const FireStore = require('./api/firebase/firestore');
const FuelCheck = require('./api/fuelcheck/fuelcheck');
const MongoDB = require('./api/mongodb/mongodb');

// Credentials need to be retrieved from the corresponding Api services.
const firebaseCredentials = require('./api/firebase/firebase-credentials');
const fuelcheckCredentials = require('./api/fuelcheck/fuelcheck-credentials');
const mongodbCredentials = require('./api/mongodb/mongodb-credentials');

syncBrands = async (fuelcheck, database) => {

    const databaseBrands = database.brands();
    const fuelcheckBrands = fuelcheck.brands();

    const toBeActivated = utils.difference(fuelcheckBrands, databaseBrands);
    const toBeDeactivated = utils.difference(databaseBrands, fuelcheckBrands)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDeactivated, (deactivated) => {
        promises.push(database.setBrand(deactivated));
    });

    _.each(toBeActivated, (activated) => {
        promises.push(database.setBrand(activated));
    });

    await Promise.all(promises);

    return {
        added: toBeActivated,
        deleted: toBeDeactivated
    };
};

syncFueltypes = async (fuelcheck, database) => {

    const databaseFueltypes = database.fueltypes();
    const fuelcheckFueltypes = fuelcheck.fueltypes();

    const toBeActivated = utils.difference(fuelcheckFueltypes, databaseFueltypes);
    const toBeDeactivated = utils.difference(databaseFueltypes, fuelcheckFueltypes)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDeactivated, (deactivated) => {
        promises.push(database.setFueltype(deactivated));
    });

    _.each(toBeActivated, (activated) => {
        promises.push(database.setFueltype(activated));
    });

    await Promise.all(promises);

    return {
        added: toBeActivated,
        deleted: toBeDeactivated
    };
};

syncStations = async (fuelcheck, database) => {

    const databaseStations = database.stations();
    const fuelcheckStations = fuelcheck.stations();

    const toBeActivated = utils.difference(fuelcheckStations, databaseStations);
    const toBeDeactivated = utils.difference(databaseStations, fuelcheckStations)
        .map(utils.deactivate);

    let promises = [];
    _.each(toBeDeactivated, (deactivated) => {
        promises.push(database.setStation(deactivated));
    });

    _.each(toBeActivated, (activated) => {
        promises.push(database.setStation(activated));
    });

    await Promise.all(promises);

    return {
        added: toBeActivated,
        deleted: toBeDeactivated
    };
};

syncPrices = async (fuelcheck, database) => {

    // const databasePrices = database.prices();
    const fuelcheckPrices = fuelcheck.prices();
    // console.log(_.groupBy(fuelcheckPrices, 'id'));
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

    const syncResults = await Promise.all(syncPromises);
    console.log(JSON.stringify(syncResults));
};

main().then(() => {
    process.exit();
});

