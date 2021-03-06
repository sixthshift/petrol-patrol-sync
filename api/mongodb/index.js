const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const mongoUtils = require('./utils');
const utils = require('../../util/utils');

module.exports = class MongoDB {

    constructor() {
        this.mongodb = null;
        this.analysisData = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.hashData = null;
        this.stationsData = null;
        this.pricesData = null;
    }

    /**
     * Determines whether initialisation is successful or not
     * 
     * @returns {boolean}
     */
    isInitialised() {
        return !!this.mongodb;
    }

    /**
     * Initialises self with the given credentials
     * 
     * @param {object} mongoCredentials
     * @returns {object} The response status of the method
     */
    async init(mongoCredentials) {

        const uri = mongoUtils.buildUri(mongoCredentials);
        try {
            const mongoClient = await MongoClient.connect(uri);
            this.mongodb = mongoClient.db(mongoCredentials.db);
            [
                this.analysisData,
                this.brandsData,
                this.fueltypesData,
                this.hashData,
                this.stationsData,
                this.pricesData
            ] = await Promise.all(
                [
                    this.fetchCollection('analysis'),
                    this.fetchCollection('brands'),
                    this.fetchCollection('fueltypes'),
                    this.fetchCollection('hash'),
                    this.fetchCollection('stations'),
                    this.fetchCollection('prices')
                ]
            );

            return {
                status: true,
                response: 'Initialisation successful',
            };
        } catch (error) {
            return {
                status: false,
                response: error,
            };
        }
    }

    /**
     * Fetchs a list of documents from MongoDB
     * 
     * @param {string} collection The collection name in MongoDB to fetch from
     * @returns {[object]}A list of documents
     */
    async fetchCollection(collection) {
        if (this.isInitialised()) {
            const snapshot = await this.mongodb.collection(collection).find();
            const documents = await snapshot.toArray();

            const activeDocuments = _.filter(documents, utils.isActive);
            const normalisedDocuments = _.map(activeDocuments, mongoUtils.omitInternalID);
            return normalisedDocuments;
        } else {
            return [];
        }
    }

    /**
     * Writes a document to MongoDB
     * 
     * @param {string} collection The collection name in MongoDB to write to
     * @param {string} documentID The MongoDB internal id to assign to the document
     * @param {object} document The document to write
     * @returns {Promise}
     */
    async setDocument(collection, documentID, document) {
        if (this.isInitialised()) {
            document = mongoUtils.assignInternalID(documentID, document);
            return this.mongodb.collection(collection).replaceOne({ _id: documentID }, document, { upsert: true });
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Deletes a document from MongoDB
     * 
     * @param {string} collection The collection name in MongoDB to delete from
     * @param {string} documentID The MongoDB internal id of the document to delete
     * @returns {Promise}
     */
    async unsetDocument(collection, documentID) {
        if (this.isInitialised()) {
            return this.mongodb.collection(collection).deleteOne({ _id: documentID });
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * returns the current analysis from MongoDB
     * 
     * @returns {object}
     */
    analysis() {
        if (this.isInitialised()) {
            return _.last(this.analysisData);
        } else {
            return null;
        }
    }

    /**
     * Returns a list of brands from MongoDB
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
     * Returns a list of fueltypes from MongoDB
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
     * Returns a list of collection hashes from MongoDB
     * 
     * @returns {[object]} A list of collection hashes
     */
    hash() {
        if (this.isInitialised()) {
            return this.hashData;
        } else {
            return [];
        }
    }

    /**
     * Returns a list of prices from MongoDB
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
     * Returns a list of stations from MongoDB
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

    /**
     * Writes an analysis object to MongoDB
     * 
     * @param {object} analysis 
     */
    async setAnalysis(analysis) {
        if (this.isInitialised()) {
            return this.setDocument('analysis', analysis.timestamp, analysis);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a brand object to MongoDB
     * 
     * @param {object} brand The brand object to write
     * @returns {Promise}
     */
    async setBrand(brand) {
        if (this.isInitialised()) {
            return this.setDocument('brands', brand.name, brand);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a fueltype object to MongoDB
     * 
     * @param {object} fueltype The fueltype object to write
     * @returns {Promise}
     */
    async setFueltype(fueltype) {
        if (this.isInitialised()) {
            return this.setDocument('fueltypes', fueltype.code, fueltype);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a given hash value associated with the collection to MongoDB
     * 
     * @param {string} collection The name of the collection that is hashed
     * @param {string} hash The hash value to be stored
     * @returns {Promise}
     */
    async setHash(collection, hash) {
        if (this.isInitialised()) {
            const document = { hash: hash }; // Wrap the hash string value in a document
            return this.setDocument('hash', collection, document);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a statistics object to MongoDB
     * 
     * @param {object} statistics The statistics object to write
     * @returns {Promise}
     */
    async setStatistics(statistics) {
        if (this.isInitialised()) {
            return this.setDocument('statistics', statistics.timestamp, statistics);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a price object to MongoDB
     * 
     * @param {object} price The price object to write
     * @returns {Promise}
     */
    async setPrice(price) {
        if (this.isInitialised()) {
            const hashID = utils.hash(_.pick(price, ['id', 'fueltype']));
            return this.setDocument('prices', hashID, price);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a station object to MongoDB
     * 
     * @param {object} station The station object to write
     * @returns {Promise}
     */
    async setStation(station) {
        if (this.isInitialised()) {
            return this.setDocument('stations', station.id, station);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Deletes a price object from MongoDB
     * 
     * @param {object} price The price object to delete
     * @returns {Promise}
     */
    async unsetPrice(price) {
        if (this.isInitialised()) {
            const hashID = utils.hash(_.pick(price, ['id', 'fueltype']));
            return this.unsetDocument('prices', hashID);
        } else {
            return utils.emptyPromise();
        }
    }
}