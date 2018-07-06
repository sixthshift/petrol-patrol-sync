#!/usr/bin/node

const _ = require('lodash');
const constants = require('./constants');
const log = require('./util/log');
const time = require('./util/time');
const utils = require('./util/utils');

const FireDB = require('./api/firebase/firedb');
const FuelCheck = require('./api/fuelcheck/fuelcheck');
const MongoDB = require('./api/mongodb/mongodb');

// Credentials need to be retrieved from the corresponding Api services.
const firebaseCredentials = require('./api/firebase/firebase-credentials');
const fuelcheckCredentials = require('./api/fuelcheck/fuelcheck-credentials');
const mongodbCredentials = require('./api/mongodb/mongodb-credentials');

syncBrands = async (fuelcheck, database, firedb) => {
    log.info('Syncing brands');

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
        collection: 'brands',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncFueltypes = async (fuelcheck, database, firedb) => {
    log.info('Syncing fueltypes');

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
        collection: 'fueltypes',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncStations = async (fuelcheck, database, firedb) => {
    log.info('Syncing stations');

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
        collection: 'stations',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncPrices = async (fuelcheck, database, firedb) => {
    log.info('Syncing prices');

    const databasePrices = database.prices();
    const fuelcheckPrices = fuelcheck.prices();

    let toBeUpdated = utils.difference(fuelcheckPrices, databasePrices);
    let toBePreserved = utils.difference(databasePrices, toBeUpdated);
    let toBeExpired = _.union(toBeUpdated, toBePreserved).filter(utils.isExpired);

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
        collection: 'prices',
        enabled: toBeUpdated,
        disabled: toBeExpired,
    };
}

main = async () => {
    log.info('Begin sync');

    let initialisationPromises = [];

    const fuelcheck = new FuelCheck();
    initialisationPromises.push(fuelcheck.init(fuelcheckCredentials));

    const mongodb = new MongoDB();
    initialisationPromises.push(mongodb.init(mongodbCredentials));

    const firedb = new FireDB();
    initialisationPromises.push(firedb.init(firebaseCredentials));

    const initialisationResults = await Promise.all(initialisationPromises);
    const initialisationErrors = _.filter(initialisationResults, utils.isError);

    if (!_.isEmpty(initialisationErrors)) {
        _.each(initialisationErrors, (error) => {
            log.error(error);
        });
    } else {
        const syncPromises = [];

        syncPromises.push(syncBrands(fuelcheck, mongodb, firedb));
        syncPromises.push(syncFueltypes(fuelcheck, mongodb, firedb));
        syncPromises.push(syncStations(fuelcheck, mongodb, firedb));
        syncPromises.push(syncPrices(fuelcheck, mongodb, firedb));

        const syncResults = await Promise.all(syncPromises);
        _.each(syncResults, (result) => {
            const numEnabled = _.size(result.enabled);
            const numDisabled = _.size(result.disabled);

            log.info(numEnabled + ' enabled in ' + result.collection);
            log.debug(JSON.stringify(result.enabled, null, 2));

            log.info(numDisabled + ' disabled in ' + result.collection);
            log.debug(JSON.stringify(result.disabled, null, 2));
        });
    }
    log.info('End sync');
};

main().then(() => {
    process.exit();
});