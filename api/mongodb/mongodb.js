const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const utils = require('../../utils');

module.exports = class Mongo {

    constructor() {
        this.mongodb = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.stationsData = null;
        this.pricesData = null;
    }

    static buildUri(credentials) {
        return 'mongodb://' + credentials.username + ':' + credentials.password + '@' + credentials.url + '/' + credentials.db;
    }

    static isActive(object) {
        if (_.has(object, 'active')) {
            return object.active === true;
        } else {
            return true;
        }
    }

    static omitInternalID(object) {
        return _.omit(object, '_id');
    }

    static assignInternalID(documentID, document) {
        return _.assign(document, { _id: documentID });
    }

    isInitialised() {
        return !!this.mongodb;
    }

    async init(mongoCredentials) {
        const uri = Mongo.buildUri(mongoCredentials);
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

    async fetchCollection(collection) {
        if (this.isInitialised()) {
            const snapshot = await this.mongodb.collection(collection).find();
            const documents = await snapshot.toArray();

            const activeDocuments = _.filter(documents, Mongo.isActive);
            const normalisedDocuments = _.map(activeDocuments, Mongo.omitInternalID);
            return normalisedDocuments;
        } else {
            return [];
        }
    }

    async setDocument(collection, documentID, document) {
        document = Mongo.assignInternalID(documentID, document);
        return this.mongodb.collection(collection).replaceOne({ _id: documentID }, document, { upsert: true });
    }

    // () => (object)
    fueltypes() {
        if (this.isInitialised()) {
            return this.fueltypesData;
        } else {
            return [];
        }
    }

    async setFueltype(document) {
        return this.setDocument('fueltypes', document.code, document);
    }

    // () => (object)
    brands() {
        if (this.isInitialised()) {
            return this.brandsData;
        } else {
            return [];
        }
    }

    async setBrand(document) {
        return this.setDocument('brands', document.name, document);
    }

    stations() {
        if (this.isInitialised()) {
            return this.stationsData;
        } else {
            return [];
        }
    }

    async setStation(document) {
        return this.setDocument('stations', document.id, document);
    }

    prices() {
        if (this.isInitialised()) {
            return this.pricesData;
        } else {
            return [];
        }
    }

    async setPrice(document) {
        const hashID = utils.hash(_.pick(document, ['id', 'fueltype']));
        return this.setDocument('prices', hashID, document);
    }
}