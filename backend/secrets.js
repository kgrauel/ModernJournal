
const fs = require('fs');

const DEFAULT_SECRETS = {
    "detailed_error_reporting": false,
    "server_port": 3000, 
    "db_uri": "mongodb://localhost:27017",
    "db_name": "modernjournal_test",
    "test_users": []
}

let SECRETS_CACHE = new Map();

function getSecrets(path = './secrets.json') {
    // Check if we've already loaded the secrets for this path
    if (SECRETS_CACHE.has(path)) {
        return SECRETS_CACHE.get(path);
    }

    let secrets = null;
    try {
        secrets = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (err) {
        console.error(`Error reading ${path}: ${err}`);
        console.error(`Using default secrets instead.`);
        secrets = DEFAULT_SECRETS;
    }

    // Add default values for any missing secrets
    for (let key in DEFAULT_SECRETS) {
        if (!secrets.hasOwnProperty(key)) {
            secrets[key] = DEFAULT_SECRETS[key];
        }
    }

    // Cache the secrets for this path
    SECRETS_CACHE.set(path, secrets);

    return secrets;
}

module.exports = getSecrets;