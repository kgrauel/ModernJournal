const fs = require('fs');
const {MongoClient} = require('mongodb');
const express = require('express');

class Server {
    constructor() {
        this.secrets = this.getSecrets();

        this.mongoClient = new MongoClient(this.secrets.db_uri, {useNewUrlParser: true});
        this.db = this.mongoClient.db(this.secrets.db_name);

        this.app = express();
        this.configureMiddleware();
        this.configureRoutes();
    }

    // Server secrets are stored in a .json file, "secrets.json",
    // which is not included in the repository. It is a simple
    // set of key-value pairs, where the key is the name of the secret.
    getSecrets() {
        let secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));

        secrets.port = secrets.server_port || 3000;
        secrets.db_uri = secrets.db_uri || 'mongodb://localhost:27017';
        secrets.db_name = secrets.db_name || 'modernjournal_test';

        return secrets;   
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
    }
 
    configureRoutes() {
        this.app.get('/', this.handleHome.bind(this));
    }

    startListening() {
        this.app.listen(this.secrets.port, () => {
            console.log(`Listening on port ${this.secrets.port}`);
        });
    }

    // Replies with DB ping time.
    async handleHome(req, res) {
        let pingTime = await this.pingMongo();
        res.send(`Ping time: ${pingTime} ms`);
    }
}

async function main() {
    let SERVER = new Server();
    await SERVER.pingMongo();
    SERVER.startListening();
}

main();