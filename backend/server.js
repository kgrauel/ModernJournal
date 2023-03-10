const fs = require('fs');
const {MongoClient} = require('mongodb');
const express = require('express');
const bcrypt = require('bcryptjs');
const validate = require('validate.js');
const getSecrets = require('./secrets');

const cla = require('command-line-args');
const optionDefinitions = [
    { name: 'secrets', alias: 's', type: String, defaultValue: './secrets.json' },
];
const OPTIONS = cla(optionDefinitions);


const PRIVILEGE_NONE = 0;
const PRIVILEGE_USER = 1;
const PRIVILEGE_ADMIN = 2;

class Endpoint {
    constructor(path, method, handler, validator, privilegeLevel) {
        this.path = path;
        this.method = method;
        this.handler = handler;
        this.validator = validator;
        this.privilegeLevel = privilegeLevel;
    }
}

class AuthInfo {
    constructor(email, privilegeLevel, token) {
        this.email = email;
        this.privilegeLevel = privilegeLevel;
        this.token = token;
    }
}


class Server {
    constructor() {
        this.secrets = getSecrets(OPTIONS.secrets);

        this.mongoClient = new MongoClient(this.secrets.db_uri, {useNewUrlParser: true});
        this.db = this.mongoClient.db(this.secrets.db_name);

        this.app = express();
        this.app.set('trust proxy', 'loopback');
        this.configureMiddleware();

        this.endpoints = new Map();
    }

    handle(endpoint) {
        this.endpoints.set(endpoint.path, endpoint);

        let lambda = async (req, res) => {

            // Validate request
            if (endpoint.validator) {
                let errors = validate(req.body, endpoint.validator);
                if (errors) {
                    res.status(400).json({ success: false, message: 'Invalid request' });
                    console.log(`  => validation fail: ${JSON.stringify(errors)}`);
                    return;
                }
            }
            
            // Check privilege level and look up session token

            let authInfo = null;

            if (endpoint.privilegeLevel > PRIVILEGE_NONE) {
                if (!req.body.token) {
                    res.status(401).json({ success: false, message: 'Unauthorized'});
                    console.log(`  => no token in body`);
                    return;
                }

                let token = req.body.token;
                let session = await this.db.collection('sessions')
                    .findOne({session_id: token, expires: {$gt: Date.now()}});

                if (!session) {
                    res.status(401).json({ success: false, message: 'Unauthorized'});
                    console.log(`  => token not in db`);
                    return;
                }

                let privilege = session.privilege || PRIVILEGE_USER;
                if (privilege < endpoint.privilegeLevel) {
                    res.status(401).json({ success: false, message: 'Unauthorized'});
                    console.log(`  => insufficient privilege`);
                    return;
                }

                authInfo = new AuthInfo(session.email, privilege, token);
            }

            console.log(`  => auth: ${authInfo ? authInfo.email : 'none'}`);

            let requestInfo =  {
                time: Date.now(),
                ip: req.ip,
                auth: authInfo,
                method: endpoint.method,
                path: endpoint.path,
                params: req.body,
            };

            // Call the endpoint handler
            await endpoint.handler(authInfo, this, req.body, (result) => {
                requestInfo.result = {
                    success: true,
                    ...result
                }
                requestInfo.result_status = 200;
                res.status(200).json(requestInfo.result);
                console.log(`  => success ${JSON.stringify(result)}`);

                // Runs in background
                this.db.collection('requests').insertOne(requestInfo);
            }, (err) => {
                requestInfo.result = {
                    success: false,
                    message: "" + err
                }
                requestInfo.result_status = 500;
                res.status(500).json(requestInfo.result);
                console.log(`  => error ${JSON.stringify(err)}`);

                // Runs in background
                this.db.collection('requests').insertOne(requestInfo);
            });
        };

        if (endpoint.method.toLowerCase() === 'post') {
            this.app.post(endpoint.path, lambda);
        } else if (endpoint.method.toLowerCase() === 'get') {
            this.app.get(endpoint.path, lambda);
        } else {
            throw new Error(`Invalid method: ${endpoint.method}`);
        }
    }

    // Ping the database to make sure it's up and running.
    // Returns a promise that resolves to how long the ping took in ms.
    async pingMongo() {
        try {
            let start = Date.now();
            await this.db.command({ping: 1});
            let end = Date.now();
            return end - start;
        } catch (err) {
            console.error(`Error pinging MongoDB: ${err}`);
            throw err;
        }
    }

    configureMiddleware() {
        this.app.use(express.json());

        this.hitCount = 0;
        
        this.app.use(async (req, res, next) => {
            // The use of the JSON middleware implies that the request body
            // req.body is a JSON object. On any failure, it's {}.
            this.hitCount++;
            req.hitCount = this.hitCount;

            // Check this IP for # of requests in last 30 seconds
            let ip = req.ip;
            let now = Date.now();
            let cutoff = now - this.secrets.rate_limit_window_ms;

            let requests = await this.db.collection('requests').countDocuments({
                time: {$gt: cutoff},
                ip: ip,
            });

            let pause = 0;
            if (requests > this.secrets.rate_limit_request_count_start) {
                pause = (requests - this.secrets.rate_limit_request_count_start)
                    * this.secrets.rate_limit_delay_per_request_ms;
            }

            console.log(
                `[${req.method} #${this.hitCount}`
                + (requests > this.secrets.rate_limit_request_count_start ?
                    ` RL ${requests} +${pause}ms` : ``)
                + `] ${req.path} ${JSON.stringify(req.body)}`);

            await new Promise((resolve) => setTimeout(resolve, pause));

            next();
        });
    }

    startListening() {
        this.app.listen(this.secrets.server_port, () => {
            console.log(`Listening on port ${this.secrets.server_port}`);
        });
    }

    // Generates a session token for a user.
    // Returns a promise that resolves to the token.
    async generateSessionToken(email) {
        // Session IDs are 32 characters long [a-zA-Z0-9].
        let sessionId = '';
        let sessionChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 32; i++) {
            let index = Math.floor(Math.random() * sessionChars.length);
            sessionId += sessionChars[index];
        }

        let session = {
            session_id: sessionId,
            email: email,
            expires: Date.now() + (1000 * 60 * 60 * 24 * 7) // 7 days
        };

        try {
            await this.db.collection('sessions').insertOne(session);
            return sessionId;
        }
        catch (err) {
            console.error(`Error inserting session: ${err}`);
            return null;
        }
    }
}

async function main() {


    const SERVER = new Server();
    await SERVER.pingMongo();

    SERVER.handle(new Endpoint(
        '/api/authenticate', 'POST', 
        async (auth, server, params, resolve, reject) => {
            let {email, password} = params;
            let user = await server.db.collection('users').findOne({email: email});
            if (!user) { reject("Invalid email or password"); return; }

            let passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) { reject("Invalid email or password"); return; }

            // The user has been successfully logged in.
            // Generate a session token and send it back to the client.
            let token = await server.generateSessionToken(user.email);
            if (!token) { reject("Error generating session token"); return; }

            resolve({token: token});
        }, {
            email:  {
                presence: true,
                email: true
            }, 
            password: {
                presence: true,
                length: {
                    minimum: 8
                },
            }
        }, 
        PRIVILEGE_NONE
    ));

    SERVER.handle(new Endpoint(
        '/api/ping', 'POST',
        async (auth, server, params, resolve, reject) => {
            let pingTime = await server.pingMongo();
            resolve({time_ms: pingTime, email: auth.email});
        }, {}, PRIVILEGE_USER
    ));

    SERVER.handle(new Endpoint(
        '/api/logout', 'POST',
        async (auth, server, params, resolve, reject) => {
            let {invalidate_all} = params;
            if (invalidate_all) {
                await server.db.collection('sessions').deleteMany({email: auth.email});
            } else {
                await server.db.collection('sessions').deleteOne({session_id: auth.token});
            }
            resolve({});
        }, {
            invalidate_all: {
                type: 'boolean'
            }
        }, PRIVILEGE_USER
    ));


    SERVER.startListening();
}

main();