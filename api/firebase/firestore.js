const admin = require('firebase-admin');
const utils = require('../../util/utils');

module.exports = class FireStore {

    constructor() {
        this.firestore = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.stationsData = null;
    }

    // () => (boolean)
    isInitialised() {
        return !!this.firestore;
    }

    async init(firebaseCredentials) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseCredentials),
        });
        this.firestore = admin.firestore();
        try {
            [
                this.brandsData,
                this.fueltypesData,
                this.stationsData
            ] = await Promise.all(
                [
                    this.fetchCollection('brands'),
                    this.fetchCollection('fueltypes'),
                    this.fetchCollection('stations'),
                ]
            );
            return {
                status: true,
                response: 'Initialisation Successful',
            };
        } catch (error) {
            return {
                status: false,
                response: error,
            };
        }
    }

    // (collection:string) => (Promise)
    async fetchCollectionSnapshot(collection) {
        return this.firestore.collection(collection).get();
    }

    // () => (object)
    async fetchCollection(collection) {
        if (this.isInitialised()) {
            var snapshot = await this.fetchCollectionSnapshot(collection);
            var array = [];
            snapshot.forEach(element => {
                array.push(element.data());
            });
            return array;
        } else {
            return [];
        }
    }

    async setDocument(collection, documentID, document) {
        if (this.isInitialised()) {
            const sanitisedID = utils.sanitiseID(documentID);
            return this.firestore.collection(collection).doc(sanitisedID).set(document);
        } else {
            return [];
        }
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
};