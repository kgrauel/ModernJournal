
const REQUESTS = [
    {
        time: 1600000000000,
        ip: '1.1.1.1',
        auth: null,

        method: 'POST',
        path: '/api/authenticate',
        params: {email: "wrong@fake.com", password: "wrong"},

        result: {success: false, message: "Invalid email or password"},
        result_status: 400
    }
];

module.exports = (secrets) => { return REQUESTS; }