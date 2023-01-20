
const bcrypt = require('bcryptjs');

function getUsers(secrets) {
    let users = [
        // filled from secrets 
    ];
    
    for (let user of secrets.test_users) {
        let hash = bcrypt.hashSync(user.password, 10);
    
        users.push({
            password: hash,
            email: user.email,
            email_verified: true,
            created: Date.now(),
            last_login: null,
            first_name: user.first_name,
        });
    }    

    return users;
}


module.exports = getUsers;