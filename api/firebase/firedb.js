const admin = require('firebase-admin');
const utils = require('../../utils');

module.exports = class Database {

    constructor() {
        this.database = null;
    }

    isInitialised() {
        return !!this.database;
    }

    async init(firebaseCredentials) {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseCredentials),
            databaseURL: "https://petrol-patrol.firebaseio.com"
        });
        this.database = admin.database();

        return {
            status: true,
            responseCode: 'success',
            response: 'Initialisation successful'
        };
    }

    async setDocument(collection, documentID, document) {
        if (this.isInitialised()) {
            return this.database.ref(collection).child(documentID).set(document);
        } else {
            return utils.emptyPromise();
        }
    }

    async unsetDocument(collection, documentID) {
        if (this.isInitialised()) {
            return this.database.ref(collection).child(documentID).set(null);
        } else {
            return utils.emptyPromise();
        }
    }

};