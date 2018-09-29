const _ = require('lodash');
const axios = require('axios');
const constants = require('../../constants');
const fuelcheckUtils = require('./utils');
const geohash = require('latlon-geohash');
const jsonfile = require('../../util/jsonfile');
const log = require('../../util/log');
const time = require('../../util/time');
const utils = require('../../util/utils');

module.exports = class FuelCheck {

    constructor() {
        this.brandsData = null;
        this.fueltypesData = null;
        this.pricesData = null;
        this.stationsData = null;
        this.averagePricesData = null;
    }

    /**
     * Determines whether initialisation is successful or not
     * 
     * @returns {boolean}
     */
    isInitialised() {
        return (
            !_.isEmpty(this.brandsData)
            && !_.isEmpty(this.fueltypesData)
            && !_.isEmpty(this.pricesData)
            && !_.isEmpty(this.stationsData)
            && !_.isEmpty(this.averagePricesData)
        );
    }

    /**
     * Initialises self with the given credentials
     * 
     * @param {object} fuelcheckCredentials
     * @returns {object} The response status of the method
     */
    async init(fuelcheckCredentials) {

        try {
            const apikey = fuelcheckCredentials.key;
            const accessTokenJSON = jsonfile.readJSON(constants.accessTokenPath);
            if (fuelcheckUtils.accessTokenExpired(accessTokenJSON)) {
                throw new Error('Access token expired');
            }
            const accessToken = 'Bearer ' + accessTokenJSON.access_token;

            let response = await this.fetchReferenceData(apikey, accessToken);
            if (!response.status) {
                return response;
            }
            response = await this.fetchPricesData(apikey, accessToken);
            if (!response.status) {
                return response;
            }
            response = await this.fetchAveragePricesData();
            if (!response.status) {
                return response;
            }
            return {
                status: true,
                response: 'Initialisation successful',
            };
        } catch (error) {
            // Not valid access token, fetch new token
            log.warn('Fetching access token');
            const credentials = fuelcheckUtils.encodeBase64(fuelcheckCredentials.key, fuelcheckCredentials.secret);
            let response = await this.checkOrFetchAccessToken(credentials);
            if (!response.status) {
                return response;
            }
            // Retry initialisation
            return await this.init(fuelcheckCredentials);
        }
    }

    /**
     * Fetches the access token required for FuelCheck request authentication
     * 
     * @param {object} credentials 
     * @returns {object} The response status of the method
     */
    async checkOrFetchAccessToken(credentials) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken',
            params: {
                'grant_type': 'client_credentials',
            },
            headers: {
                'Authorization': 'Basic ' + credentials,
            },
        };
        return await axios(config)
            .then((response) => {
                jsonfile.writeJSON(constants.accessTokenPath, response.data);
                return {
                    status: true,
                    response: 'Access token successfully generated',
                };
            }).catch((error) => {
                return {
                    status: false,
                    response: error,
                };
            });
    }

    /**
     * Fetches average price data from the FuelCheck API
     * 
     * @returns {object} The response status of the method
     */
    async fetchAveragePricesData() {
        const config = {
            method: 'get',
            url: 'http://api.onegov.nsw.gov.au/FuelCheckApp/v1/fuel/prices/currenttrend',
        };
        return await axios(config)
            .then((response) => {
                this.averagePricesData = response;
                return {
                    status: true,
                    response: 'Reference data successfully fetched',
                };
            }).catch((error) => {
                return {
                    status: false,
                    response: error,
                };
            });
    }

    /**
     * Fetches reference data from the FuelCheck API
     * 
     * @param {string} apikey 
     * @param {string} accessToken 
     * @returns {object} The response status of the method
     */
    async fetchReferenceData(apikey, accessToken) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelCheckRefData/v1/fuel/lovs',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'if-modified-since': time.epoch().format(time.formatString),
                'requesttimestamp': time.now().format(time.formatString),
                'transactionid': '1',
            },
        };
        return await axios(config)
            .then((response) => {
                const rebuildBrand = (brand, index) => {
                    return {
                        name: brand.name,
                        active: true,
                        order: index,
                    };
                };
                this.brandsData = response.data.brands.items.map(rebuildBrand);

                const rebuildFueltypeData = (fueltype, index) => {
                    return {
                        code: fueltype.code,
                        name: fueltype.name,
                        active: true,
                        order: index,
                    };
                };
                this.fueltypesData = response.data.fueltypes.items.map(rebuildFueltypeData);

                const rebuildStationData = (station) => {
                    return {
                        active: true,
                        brand: station.brand,
                        g: geohash.encode(station.location.latitude, station.location.longitude, constants.geohashPrecision),
                        id: station.code,
                        location: {
                            latitude: station.location.latitude,
                            longitude: station.location.longitude,
                        },
                        l: [
                            station.location.latitude,
                            station.location.longitude,
                        ],
                        name: station.name,
                        ...fuelcheckUtils.splitAddress(station.address),
                    }
                };
                this.stationsData = response.data.stations.items.map(rebuildStationData);
                return {
                    status: true,
                    response: 'Reference data successfully fetched',
                };
            }).catch((error) => {
                return {
                    status: false,
                    response: error,
                };
            });
    }

    /**
     * Fetches price data from the FuelCheck API
     * 
     * @param {string} apikey 
     * @param {string} accessToken 
     * @returns {object} The response status of the method
     */
    async fetchPricesData(apikey, accessToken) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'requesttimestamp': time.now().format(time.formatString),
                'transactionid': '1',
            },
        };
        return await axios(config)
            .then((response) => {
                const rebuildPrice = (price) => {
                    return {
                        id: price.stationcode,
                        fueltype: price.fueltype,
                        price: price.price,
                        time: time.parseTimestamp(price.lastupdated).unix(),
                        stale: utils.isStale(price),
                    };
                };
                const rebuiltPrices = _.map(response.data.prices, rebuildPrice);
                const activePrices = _.reject(rebuiltPrices, utils.isExpired);
                this.pricesData = activePrices;
                return {
                    status: true,
                    response: 'Prices data successfully fetched',
                };
            })
            .catch((error) => {
                return {
                    status: false,
                    response: error,
                };
            });
    }

    /**
     * Returns a list of brands from the FuelCheck API
     * 
     * @returns {[object]} A list of brands
     */
    brands() {
        if (this.isInitialised()) {
            return _.sortBy(this.brandsData, 'order');
        } else {
            return [];
        }
    }

    /**
     * Returns a list of fueltypes from the FuelCheck API
     * 
     * @returns {[object]} A list of fueltypes
     */
    fueltypes() {
        if (this.isInitialised()) {
            return _.sortBy(this.fueltypesData, 'order');
        } else {
            return [];
        }
    }

    /**
     * Returns a list of prices from the FuelCheck API
     * 
     * @returns {[object]} A list of prices
     */
    prices() {
        if (this.isInitialised()) {
            return this.pricesData;
        } else {
            return [];
        }
    }

    /**
     * Returns a list of stations from the FuelCheck API
     * 
     * @returns {[object]} A list of stations
     */
    stations() {
        if (this.isInitialised()) {
            return this.stationsData;
        } else {
            return [];
        }
    }
}