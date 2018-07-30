const jsonfile = require('jsonfile');
const tabSpace = 4;

/**
 * Reads a JSON file at the given path
 * Throws an error if JSON file does not exist at the given path
 * 
 * @param {string} path The file path to read from
 * @returns {object} The JSON file as an object
 */
const readJSON = (path) => {
    return jsonfile.readFileSync(path);
}

/**
 * Writes an object as JSON at the given path
 * 
 * @param {*} path The file path to write the object to
 * @param {*} obj The object to be written
 */
const writeJSON = (path, obj) => {
    jsonfile.writeFileSync(path, obj, { spaces: tabSpace });
}

module.exports = {
    readJSON,
    writeJSON,
};