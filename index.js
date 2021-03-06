#!/usr/bin/node

const _ = require('lodash');
const circularJSON = require('circular-json');
const log = require('./util/log');
const time = require('./util/time');
const utils = require('./util/utils');

const Analysis = require('./api/analysis');
const FireDB = require('./api/firebase/firedb');
const FuelCheck = require('./api/fuelcheck');
const MongoDB = require('./api/mongodb');

// Credentials need to be retrieved from the corresponding API services.
const firebaseCredentials = require('./credentials/petrol-patrol-sync/firebase-credentials');
const fuelcheckCredentials = require('./credentials/petrol-patrol-sync/fuelcheck-credentials');
const mongodbCredentials = require('./credentials/petrol-patrol-sync/mongodb-credentials');

const statistics = require('./statistics');

const now = time.floor(time.now(), 10).unix();

syncAnalysis = async (analysis, database, firedb) => {

    const databaseAnalysis = database.analysis();
    const parsedAnalysis = analysis.fetch();

    let toBeEnabled = [];
    let toBeDisabled = [];

    if (_.every(parsedAnalysis, _.negate(_.isNull)) && !_.isEqual(databaseAnalysis, parsedAnalysis)) {
        toBeEnabled = parsedAnalysis;
        toBeDisabled = databaseAnalysis;

        let promises = [];

        promises.push(database.setAnalysis(toBeEnabled));
        promises.push(firedb.setAnalysis(toBeEnabled));

        const hash = utils.hash(toBeEnabled);
        promises.push(database.setHash('analysis', hash));
        promises.push(firedb.setHash('analysis', hash));

        await Promise.all(promises);
    }

    return {
        collection: 'analysis',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncBrands = async (fuelcheck, database, firedb) => {
    const databaseBrands = database.brands();
    const fuelcheckBrands = fuelcheck.brands();

    let toBeEnabled = [];
    let toBeSame = [];
    let toBeDisabled = [];

    if (!_.isEqual(databaseBrands, fuelcheckBrands)) {
        toBeEnabled = utils.difference(fuelcheckBrands, databaseBrands);
        toBeSame = utils.intersection(fuelcheckBrands, databaseBrands);
        toBeDisabled = utils.difference(databaseBrands, fuelcheckBrands)
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

        const union = _.union(toBeEnabled, toBeDisabled, toBeSame);
        const hash = utils.hash(union);
        promises.push(database.setHash('brands', hash));
        promises.push(firedb.setHash('brands', hash));

        await Promise.all(promises);
    }

    return {
        collection: 'brands',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncFueltypes = async (fuelcheck, database, firedb) => {
    const databaseFueltypes = database.fueltypes();
    const fuelcheckFueltypes = fuelcheck.fueltypes();

    let toBeEnabled = [];
    let toBeSame = [];
    let toBeDisabled = [];

    if (!_.isEqual(databaseFueltypes, fuelcheckFueltypes)) {
        toBeEnabled = utils.difference(fuelcheckFueltypes, databaseFueltypes);
        toBeSame = utils.intersection(fuelcheckFueltypes, databaseFueltypes);
        toBeDisabled = utils.difference(databaseFueltypes, fuelcheckFueltypes)
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

        const union = _.union(toBeEnabled, toBeDisabled, toBeSame);
        const hash = utils.hash(union);
        promises.push(database.setHash('fueltypes', hash));
        promises.push(firedb.setHash('fueltypes', hash));

        await Promise.all(promises);
    }

    return {
        collection: 'fueltypes',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncStations = async (fuelcheck, database, firedb) => {
    const databaseStations = database.stations();
    const fuelcheckStations = fuelcheck.stations();

    let toBeEnabled = [];
    let toBeSame = [];
    let toBeDisabled = [];

    if (!_.isEqual(databaseStations, fuelcheckStations)) {
        toBeEnabled = utils.difference(fuelcheckStations, databaseStations);
        toBeSame = utils.intersection(fuelcheckStations, databaseStations);
        toBeDisabled = utils.difference(databaseStations, fuelcheckStations)
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

        const union = _.union(toBeEnabled, toBeDisabled, toBeSame);
        const hash = utils.hash(union);
        promises.push(database.setHash('stations', hash));
        promises.push(firedb.setHash('stations', hash));

        await Promise.all(promises);
    }

    return {
        collection: 'stations',
        enabled: toBeEnabled,
        disabled: toBeDisabled,
    };
};

syncPrices = async (fuelcheck, database, firedb) => {
    const databasePrices = database.prices();
    const fuelcheckPrices = fuelcheck.prices();

    let toBeUpdated = utils.difference(fuelcheckPrices, databasePrices);
    let toBePreserved = utils.difference(databasePrices, toBeUpdated);
    let toBeExpired = _.union(toBeUpdated, toBePreserved).filter(utils.isExpired);

    let promises = [];

    _.each(toBeUpdated, (updated) => {
        promises.push(database.setPrice(updated));
        promises.push(firedb.setPrice(updated, now)); //Firedb never deletes prices, only keeps logging
    });

    _.each(toBeExpired, (expired) => {
        promises.push(database.unsetPrice(expired));
    });

    await Promise.all(promises);

    return {
        collection: 'prices',
        enabled: toBeUpdated,
        disabled: toBeExpired,
    };
}

syncStatistics = async (fuelcheck, database, firedb) => {

    const pricesByFueltype = _.groupBy(fuelcheck.prices(), 'fueltype');
    const calculate = (accumulator, prices, fueltype) => {
        accumulator[fueltype] = {
            distribution: statistics.distribution(prices),
            max: statistics.max(prices),
            mean: statistics.mean(prices),
            median: statistics.median(prices),
            min: statistics.min(prices),
            stdev: statistics.stdev(prices),
            timestamp: now,
        };
        accumulator['timestamp'] = now;
        return accumulator;
    };
    const stats = _.reduce(pricesByFueltype, calculate, {});

    let promises = [];

    promises.push(firedb.setStatistics(stats, now));

    await Promise.all(promises);

    return {
        collection: 'statistics',
        enabled: statistics,
        disabled: null,
    };
};

main = async () => {
    log.info('Begin sync');

    let initialisationPromises = [];

    const analysis = new Analysis();
    initialisationPromises.push(analysis.init());

    const fuelcheck = new FuelCheck();
    initialisationPromises.push(fuelcheck.init(fuelcheckCredentials));

    const mongodb = new MongoDB();
    initialisationPromises.push(mongodb.init(mongodbCredentials));

    const firedb = new FireDB();
    initialisationPromises.push(firedb.init(firebaseCredentials));

    const initialisationResults = await Promise.all(initialisationPromises);
    const initialisationErrors = _.filter(initialisationResults, utils.isError);

    if (_.isEmpty(initialisationErrors)) {
        const syncPromises = [];

        syncPromises.push(syncBrands(fuelcheck, mongodb, firedb));
        syncPromises.push(syncFueltypes(fuelcheck, mongodb, firedb));
        syncPromises.push(syncStations(fuelcheck, mongodb, firedb));
        syncPromises.push(syncPrices(fuelcheck, mongodb, firedb));
        syncPromises.push(syncStatistics(fuelcheck, mongodb, firedb));
        syncPromises.push(syncAnalysis(analysis, mongodb, firedb));

        const syncResults = await Promise.all(syncPromises);
        _.each(syncResults, (result) => {
            const numEnabled = _.size(result.enabled);
            const numDisabled = _.size(result.disabled);

            log.info(numEnabled + ' enabled in ' + result.collection);
            log.debug(JSON.stringify(result.enabled));
            log.info(numDisabled + ' disabled in ' + result.collection);
            log.debug(JSON.stringify(result.disabled));
        });
    } else {
        _.each(initialisationErrors, (error) => {
            log.error(circularJSON.stringify(error));
        });
    }
    log.info('End sync');
    return _.toInteger(!_.isEmpty(initialisationErrors));
};

main().then((exitCode) => {
    process.exit(exitCode);
});