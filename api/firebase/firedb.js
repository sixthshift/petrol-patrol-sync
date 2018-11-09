const _ = require('lodash');
const admin = require('firebase-admin');
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
            const snapshot = await this.database.ref(collection).once('value');
            const documents = snapshot.val();
            const activeDocuments = _.filter(documents, utils.isActive);
            return activeDocuments;
        } else {
            return [];
        }
    }

    async fetchStations() {
        return await this.fetchCollection('stationstest');
    }

    /**
     * Writes a document to the Firebase Database
     * 
     * @param {string} collection The collection name in the Firebase database to write to
     * @param {string} documentID The the Firebase Database internal id to assign to the document
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
     * Deletes a document from the Firebase Database
     * 
     * @param {string} collection The collection name in the Firebase database to delete from
     * @param {string} documentID The the Firebase Database internal id of the document to delete
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
     * Updates an existing document into the Firebase Database
     * 
     * @param {string} collection The collection name in the Firebase
     * @param {string} documentID The the Firebase Database internal id of the document to delete
     * @returns {Promise}
     */
    async updateDocument(collection, documentID, document) {
        if (this.isInitialised()) {
            return this.database.ref(collection).child(documentID).update(document);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a brand object to the Firebase Database
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
     * Writes a fueltype object to the Firebase Database
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
     * Writes a given hash value associated with the collection to the Firebase Database
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
     * Writes a price object to the Firebase Database
     * 
     * @param {object} price The price object to write
     * @param {number} timestamp The unix time of when the calculations occurred
     * @returns {Promise}
     */
    async setPrice(price) {
        if (this.isInitialised()) {
            const timestamp = _(price).get('time');
            const hashID = utils.hash(_.pick(price, ['id', 'fueltype']));
            const preparedPrice = { [timestamp]: price };
            return this.updateDocument('prices', hashID, preparedPrice);
        } else {
            return utils.emptyPromise();
        }
    }

    /**
     * Writes a station object to the Firebase Database
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

    /**
     * Writes a collection of statistics data to the Firebase Database
     * The statistics data is indexed by the timestamp of calculation
     * 
     * @param {object} statistics A dictionary of statistics data grouped by fueltype
     * @param {number} timestamp The unix time of when the calculations occurred
     * @returns {Promise}
     */
    async setStatistics(statistics, timestamp) {
        if (this.isInitialised()) {
            const prepareForMerge = (accumulator, value, key) => {
                const path = timestamp + '/' + key;
                accumulator[path] = value;
                return accumulator;
            };
            const preparedStatistics = _.reduce(statistics, prepareForMerge, {});
            return this.updateDocument('statistics', '/', preparedStatistics);
        } else {
            return utils.emptyPromise();
        }
    }
};