const admin = require('firebase-admin');
const utils = require('../../utils');

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
            credential: admin.credential.cert(firebaseCredentials)
        });
        this.firestore = admin.firestore();
        this.brandsData = this.fetchCollection('brands');
        this.fueltypesData = this.fetchCollection('fueltypes');
        this.stationsData = this.fetchCollection('stations');
        [this.brandsData, this.fueltypesData, this.stationsData] = await Promise.all([this.brandsData, this.fueltypesData, this.stationsData]);
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
            return null;
        }
    }

    async setCollection(collection, documentID, document) {
        if (this.isInitialised()) {
            const sanitisedID = utils.sanitiseID(documentID);
            if (sanitisedID == 17260) {
                console.log(collection + ' ' + sanitisedID + ' ' + JSON.stringify(document));
            }
            return this.firestore.collection(collection).doc(sanitisedID).set(document);
        } else {
            return null;
        }
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
        return this.setCollection('fueltypes', data.code, data);
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
        return this.setCollection('brands', data.name, data);
    }

    stations() {
        if (this.isInitialised()) {
            return this.stationsData;
        } else {
            return null;
        }
    }

    async setStation(data) {
        return this.setCollection('stations', data.id, data);
    }
};