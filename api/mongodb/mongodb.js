const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const utils = require('../../utils');

module.exports = class MongoDB {

    constructor() {
        this.mongodb = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.stationsData = null;
        this.pricesData = null;
    }

    /**
     * Constructs a MongoDB URI based on credential configurations
     * 
     * @param {object} credentials 
     * @returns {string} The MongoDB URI
     */
    static buildUri(credentials) {
        return 'mongodb://' + credentials.username + ':' + credentials.password + '@' + credentials.url + '/' + credentials.db;
    }

    /**
     * Determines whether a given object is active or not,
     * if the 'active' property does not exist then it is assumed active
     * 
     * @param {object} object
     * @returns {boolean}
     */
    static isActive(object) {
        if (_.has(object, 'active')) {
            return object.active === true;
        } else {
            return true;
        }
    }

    /**
     * Omits the MongoDB internal id property from an object
     * 
     * @param {object} object 
     * @returns {object} The object with the MongoDB internal id omitted
     */
    static omitInternalID(object) {
        return _.omit(object, '_id');
    }

    /**
     * Assigns the MongoDB internal id property to an object
     * 
     * @param {string} documentID 
     * @param {object} document 
     * @returns {object} The object with the MongoDB internal id assigned
     */
    static assignInternalID(documentID, document) {
        return _.assign(document, { _id: documentID });
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
        const uri = MongoDB.buildUri(mongoCredentials);
        try {
            const mongoClient = await MongoClient.connect(uri);
            this.mongodb = mongoClient.db(mongoCredentials.db);
            [
                this.brandsData,
                this.fueltypesData,
                this.stationsData,
                this.pricesData
            ] = await Promise.all(
                [
                    this.fetchCollection('brands'),
                    this.fetchCollection('fueltypes'),
                    this.fetchCollection('stations'),
                    this.fetchCollection('prices')
                ]
            );
            return {
                status: true,
                responseCode: 'success',
                response: 'Initialisation successful'
            };
        } catch (error) {
            return {
                status: false,
                responseCode: error.name,
                response: error.message
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

            const activeDocuments = _.filter(documents, MongoDB.isActive);
            const normalisedDocuments = _.map(activeDocuments, MongoDB.omitInternalID);
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
            document = MongoDB.assignInternalID(documentID, document);
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
     * Returns a list of brands from MongoDB
     * 
     * @returns {[object]} A list of brands
     */
    brands() {
        if (this.isInitialised()) {
            return this.brandsData;
        } else {
            return [];
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
     * Returns a list of fueltypes from MongoDB
     * 
     * @returns {[object]} A list of fueltypes
     */
    fueltypes() {
        if (this.isInitialised()) {
            return this.fueltypesData;
        } else {
            return [];
        }
    }

    /**
     * Writes a fueltype object to MongoDB
     * 
     * @param {object} fueltype The fueltype object to write
     * @returns {Promise}
     */
    async setFueltype(fueltype) {
        return this.setDocument('fueltypes', fueltype.code, fueltype);
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
     * Deletes a price object from MongoDB
     * 
     * @param {*} price The price object to delete
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
}