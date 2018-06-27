const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

module.exports = class Mongo {

    constructor() {
        this.mongodb = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.stationsData = null;
    }

    isInitialised() {
        return !!this.mongodb;
    }

    static buildUri(credentials) {
        return 'mongodb://' + credentials.username + ':' + credentials.password + '@' + credentials.url + '/' + credentials.db;
    }

    static isActive(object) {
        return object.active === true;
    }

    static omitInternalID = (object) => {
        return _.omit(object, '_id');
    };

    static assignInternalID(documentID, document) {
        return _.assign(document, { _id: documentID });
    }

    async init(mongoCredentials) {
        const uri = Mongo.buildUri(mongoCredentials);
        try {
            const mongoClient = await MongoClient.connect(uri);
            this.mongodb = mongoClient.db(mongoCredentials.db);
            [
                this.brandsData,
                this.fueltypesData,
                this.stationsData
            ] = await Promise.all(
                [
                    this.fetchCollection('brands'),
                    this.fetchCollection('fueltypes'),
                    this.fetchCollection('stations')
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
            return null;
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
            return null;
        }
    }

    async setFueltype(data) {
        return this.setDocument('fueltypes', data.code, data);
    }

    // () => (object)
    brands() {
        if (this.isInitialised()) {
            return this.brandsData;
        } else {
            return null;
        }
    }

    async setBrand(data) {
        return this.setDocument('brands', data.name, data);
    }

    stations() {
        if (this.isInitialised()) {
            return this.stationsData;
        } else {
            return null;
        }
    }

    async setStation(data) {
        return this.setDocument('stations', data.id, data);
    }
}