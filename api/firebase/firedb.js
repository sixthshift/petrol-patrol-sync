const admin = require('firebase-admin');
const utils = require('../../utils');

module.exports = class Database {

    constructor() {
        this.database = null;
        this.brandsData = null;
        this.fueltypesData = null;
        this.stationsData = null;
    }

    isInitialised() {
        return !!this.database && !!this.brandsData && !!this.fueltypesData && !!this.stationsData;
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



};