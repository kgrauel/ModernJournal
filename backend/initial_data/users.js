const fs = require('fs');
const bcrypt = require('bcryptjs');
const secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));

let USERS = [
    // filled from secrets 
];

for (let user of secrets.test_users) {
    let hash = bcrypt.hashSync(user.password, 10);

    USERS.push({
        password: hash,
        email: user.email,
        email_verified: true,
        created: Date.now(),
        last_login: null,
        first_name: user.first_name,
    });
}

module.exports = USERS;