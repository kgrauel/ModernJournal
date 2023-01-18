
const fs = require('fs');

const DEFAULT_SECRETS = {
    "detailed_error_reporting": false,
    "server_port": 3000, 
    "db_uri": "mongodb://localhost:27017",
    "db_name": "modernjournal_test",
    "test_users": []
}

let SINGLETON_SECRETS = null;

function getSecrets() {
    if (SINGLETON_SECRETS) {
        return SINGLETON_SECRETS;
    }

    let secrets = null;
    try {
        secrets = JSON.parse(fs.readFileSync('./secrets.json', 'utf8'));
    } catch (err) {
        console.error(`Error reading secrets.json: ${err}`);
        console.error(`Using default secrets instead.`);
        secrets = DEFAULT_SECRETS;
    }

    // Add default values for any missing secrets
    for (let key in DEFAULT_SECRETS) {
        if (!secrets.hasOwnProperty(key)) {
            secrets[key] = DEFAULT_SECRETS[key];
        }
    }

    return secrets;
}

module.exports = getSecrets;