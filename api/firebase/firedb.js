const _ = require('lodash');
const admin = require('firebase-admin');
const log = require('../../util/log');
const utils = require('../../util/utils');

module.exports = class Database {

    constructor() {
        this.database = null;
    }

    isInitialised() {
        return !!this.database;
    }

    /**
     * Initialises self with the given credentials
     * 
     * @param {object} mongoCredentials
     * @returns {object} The response status of the method
     */
    async init(firebaseCredentials) {

        admin.initializeApp({
            credential: admin.credential.cert(firebaseCredentials),
            databaseURL: "https://petrol-patrol.firebaseio.com",
        });
        this.database = admin.database();

        return {
            status: true,
            response: 'Initialisation successful',
        };
    }

    /**
     * Fetchs a list of documents from the Firebase database
     * 
     * @param {string} collection The collection name in the Firebase database to fetch from
     * @returns {[object]}A list of documents
     */
    async fetchCollection(collection) {
        if (this.isInitialised()) {
            return (await this.database.ref(collection).once('value')).val();
        } else {
            return [];
        }
    }

    /**
     * Writes a document to the Firebase database
     * 
     * @param {string} collection The collection name in the Firebase database to write to
     * @param {string} documentID The MongoDB internal id to assign to the document
     * @param {object} document The document to write
     * @returns {Promise}
     */
    async setDocument(collection, documentID, document) {
        if (this.isInitialised()) {
            return this.database.ref(collection).child(documentID).set(document);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Deletes a document from the Firebase database
     * 
     * @param {string} collection The collection name in the Firebase database to delete from
     * @param {string} documentID The MongoDB internal id of the document to delete
     * @returns {Promise}
     */
    async unsetDocument(collection, documentID) {
        if (this.isInitialised()) {
            return this.database.ref(collection).child(documentID).set(null);
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
            return this.setDocument('brandstest', brand.name, brand);
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
            return this.setDocument('fueltypestest', fueltype.code, fueltype);
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
     * Writes a price object to MongoDB
     * 
     * @param {object} price The price object to write
     * @returns {Promise}
     */
    async setPrice(price) {
        if (this.isInitialised()) {
            const hashID = utils.hash(_.pick(price, ['id', 'fueltype']));
            return this.setDocument('pricestest', hashID, price);
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
            return this.unsetDocument('pricestest', hashID);
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
            return this.setDocument('stationstest', station.id, station);
        } else {
            return utils.emptyPromise();
        }
    }
};