const axios = require('axios');
const utils = require('../../utils');
const time = require('../../util/time');
const _ = require('lodash');

module.exports = class FuelCheck {

    constructor() {
        this.apikey = null;
        this.credentials = null;
        this.accessToken = null;
        this.pricesData = null;
        this.referenceData = null;
        this.hash = null;
    }

    // (key:string, secret:string) => (string)
    static encode(key, secret) {
        return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
    }

    // () => (boolean)
    isInitialised() {
        return !!this.apikey && !!this.credentials && !!this.accessToken && !!this.pricesData && !!this.referenceData;
    }

    // (key:string, secret: string) => (object)
    async init(fuelcheckCredentials) {
        this.apikey = fuelcheckCredentials.key;
        this.credentials = FuelCheck.encode(fuelcheckCredentials.key, fuelcheckCredentials.secret);
        let response = await this.checkOrFetchAccessToken(this.credentials);
        if (!response.status) {
            return response;
        }
        response = await this.fetchReferenceData(this.apikey, this.accessToken);
        if (!response.status) {
            return response;
        }
        response = await this.fetchPricesData(this.apikey, this.accessToken);
        if (!response.status) {
            return response;
        }
        return {
            status: true,
            responseCode: 'success',
            response: 'Initialisation successful'
        };
    }

    // (credentials:string) => (object)
    async checkOrFetchAccessToken(credentials) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken',
            params: {
                'grant_type': 'client_credentials'
            },
            headers: {
                'Authorization': credentials
            }
        };
        return await axios(config)
            .then((response) => {
                this.accessToken = 'Bearer ' + response.data.access_token;
                return {
                    status: true,
                    responseCode: 'success',
                    response: 'Access token successfully generated'
                };
            }).catch((error) => {
                try {
                    return {
                        status: false,
                        responseCode: error.response.data.ErrorCode,
                        response: error.response.data.Error
                    };
                } catch (error) {
                    // Error when generating error
                    return {
                        status: false,
                        responseCode: 'ConnectionError',
                        response: 'Cannot connect to Fuelcheck'
                    };
                }
            });
    }

    // (apikey:string, accessToken: string) => (object)
    async fetchReferenceData(apikey, accessToken) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelCheckRefData/v1/fuel/lovs',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'if-modified-since': '01/01/1970 00:00:00 AM',
                'requesttimestamp': time.currentLocalTime(),
                'transactionid': '1'
            }
        };
        return await axios(config)
            .then((response) => {
                this.referenceData = response.data;
                return {
                    status: true,
                    responseCode: 'success',
                    response: 'Reference data successfully fetched'
                };
            }).catch((error) => {
                try {
                    return {
                        status: false,
                        responseCode: error.response.data.errorDetails.code,
                        response: error.response.data.errorDetails.message
                    };
                } catch (error) {
                    // Error when generating error
                    return {
                        status: false,
                        responseCode: 'ConnectionError',
                        response: 'Cannot connect to Fuelcheck'
                    };
                }
            });
    }

    // (apikey:string, accessToken: string) => (object)
    async fetchPricesData(apikey, accessToken) {

        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'requesttimestamp': time.currentLocalTime(),
                'transactionid': '1'
            }
        };
        return await axios(config)
            .then((response) => {
                this.pricesData = response.data.prices;
                _.map(this.pricesData, (obj) => {
                    const toUnixTime = (timestamp) => {
                        return time.parseTimestamp(timestamp).getTime();
                    };
                    return _.update(obj, 'lastupdated', toUnixTime);
                });
                return {
                    status: true,
                    responseCode: 'success',
                    response: 'Prices data successfully fetched'
                };
            })
            .catch((error) => {
                try {
                    console.log(error);
                    return {
                        status: false,
                        responseCode: error.response.data.errorDetails.code,
                        response: error.response.data.errorDetails.message,
                    };
                } catch (error) {
                    // Error when generating error
                    return {
                        status: false,
                        responseCode: 'ConnectionError',
                        response: 'Cannot connect to Fuelcheck'
                    };
                }
            });
    }

    // () => (object)
    brands() {
        if (this.isInitialised()) {
            const brandsData = this.referenceData.brands.items;
            const formatBrandsData = (brand, index) => {
                return {
                    name: brand.name,
                    active: true,
                    order: index
                };
            };
            return brandsData.map(formatBrandsData);
        } else {
            return [];
        }
    }

    // () => (object)
    fueltypes() {
        if (this.isInitialised()) {
            const fueltypeData = this.referenceData.fueltypes.items;
            const formatFueltypeData = (fueltype, index) => {
                return {
                    code: fueltype.code,
                    name: fueltype.name,
                    active: true,
                    order: index,
                };
            };
            return fueltypeData.map(formatFueltypeData);
        } else {
            return [];
        }
    }

    // () => (object)
    prices() {
        if (this.isInitialised()) {
            const priceData = this.pricesData;
            const formatPriceData = (price) => {
                return {
                    id: price.stationcode,
                    fueltype: price.fueltype,
                    price: price.price,
                    time: price.lastupdated
                };
            };
            return priceData.map(formatPriceData);
        } else {
            return [];
        }
    }

    // () => (object)
    stations() {
        if (this.isInitialised()) {
            const stationsData = this.referenceData.stations.items;
            const formatStationData = (station) => {
                return {
                    id: station.code,
                    name: station.name,
                    brand: station.brand,
                    active: true,
                    location: _.merge(
                        {
                            latitude: station.location.latitude,
                            longitude: station.location.longitude
                        }, utils.splitAddress(station.address)
                    )
                };
            };
            return stationsData.map(formatStationData);
        } else {
            return [];
        }
    }
}