async function nuke_database(secrets) {
    const {MongoClient} = require('mongodb');
    const mongoClient = new MongoClient(secrets.db_uri, {useNewUrlParser: true});
    
    try {
        const db = mongoClient.db(secrets.db_name);

        console.log("Checking to make sure DB already exists...");
        let dbs = await mongoClient.db().admin().listDatabases();

        if (!dbs.databases.find(db => db.name === secrets.db_name)) {
            console.log(`Database ${secrets.db_name} does not exist! We'll create it.`);
        } else {
            console.log("Dropping DB...");
            await db.dropDatabase();
            console.log('Database cleared!');
        }

        let getUsers = require('./users');
        let getSessions = require('./sessions');
        let getRequests = require('./requests');

        console.log("Inserting initial data...");

        await db.collection('users').insertMany(getUsers(secrets));
        await db.collection('sessions').insertMany(getSessions(secrets));
        await db.collection('requests').insertMany(getRequests(secrets));


        console.log("Building indices...");

        await db.collection('users').createIndex({email: 1}, {unique: true});

        await db.collection('sessions').createIndex({session_id: 1}, {unique: true});
        await db.collection('sessions').createIndex({expires: 1});
        await db.collection('sessions').createIndex({user: 1});

        await db.collection('requests').createIndex({time: 1});
        await db.collection('requests').createIndex({user: 1});
        await db.collection('requests').createIndex({ip: 1});
        await db.collection('requests').createIndex({path: 1});
        await db.collection('requests').createIndex({result_status: 1});


        console.log("Done!");

    } finally {
        await mongoClient.close();
    }
}

module.exports = nuke_database;
