
const getSecrets = require('../secrets');
const SECRETS = getSecrets();

const SESSIONS = [
    {
        session_id: SECRETS.test_valid_token,
        email: SECRETS.test_users[0].email,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 1000), // 1000 days
    },
    {
        session_id: SECRETS.test_invalid_token,
        email: SECRETS.test_users[0].email,
        expires: Date.now() - (1000 * 60 * 60 * 24 * 7),
    },

];

module.exports = SESSIONS;