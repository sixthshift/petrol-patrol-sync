const axios = require('axios');
const utils = require('../../utils');

module.exports = class FuelCheck {

    constructor() {
        this.apikey = null;
        this.credentials = null;
        this.accessToken = null;
        this.pricesData = null;
        this.referenceData = null;
    }
    
    encode(key, secret) {
        return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
    }

    isInitialised() {
        return this.apikey && this.credentials && this.accessToken && this.pricesData && this.referenceData;
    }

    async init(key, secret) {
        this.apikey = key;
        this.credentials = this.encode(key, secret);
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
        }
    }

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
                return {
                    status: false,
                    responseCode: error.response.data.ErrorCode,
                    response: error.response.data.Error
                }
            });
    }

    async fetchReferenceData(apikey, accessToken) {
        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelCheckRefData/v1/fuel/lovs',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'if-modified-since': '01/01/1970 00:00:00 AM',
                'requesttimestamp': utils.currentTimestamp(),
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
                }
            }).catch((error) => {
                return {
                    status: false,
                    responseCode: error.response.data.errorDetails.code,
                    response: error.response.data.errorDetails.message
                }
            });
    }

    async fetchPricesData(apikey, accessToken) {

        const config = {
            method: 'get',
            url: 'https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices',
            headers: {
                'apikey': apikey,
                'Authorization': accessToken,
                'Content-Type': 'application/json; charset=utf-8',
                'requesttimestamp': utils.currentTimestamp(),
                'transactionid': '1'
            }
        };
        return await axios(config)
            .then((response) => {
                this.pricesData = response.data.prices;
                return {
                    status: true,
                    responseCode: 'success',
                    response: 'Prices data successfully fetched'
                }
            })
            .catch((error) => {
                return {
                    status: false,
                    responseCode: error.response.data.errorDetails.code,
                    repsonse: error.response.data.errorDetails.message
                }
            });
    }

    brands() {
        if (this.isInitialised()) {
            return this.referenceData.brands.items;
        } else {
            return null;
        }
    }

    fueltypes() {
        if (this.isInitialised()) {
            return this.referenceData.fueltypes.items;
        } else {
            return null;
        }
    }

    prices() {
        if (this.isInitialised()) {
            return this.pricesData;
        } else {
            return null;
        }
    }

    stations() {
        if (this.isInitialised()) {
            return this.referenceData.stations.items;
        } else {
            return null;
        }
    }
}