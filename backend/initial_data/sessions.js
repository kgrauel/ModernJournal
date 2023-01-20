
function getSessions(secrets) {
    return [
        {
            session_id: secrets.test_valid_token,
            email: secrets.test_users[0].email,
            expires: Date.now() + (1000 * 60 * 60 * 24 * 1000), // 1000 days
        },
        {
            session_id: secrets.test_invalid_token,
            email: secrets.test_users[0].email,
            expires: Date.now() - (1000 * 60 * 60 * 24 * 7),
        },
    
    ];
}

module.exports = getSessions;