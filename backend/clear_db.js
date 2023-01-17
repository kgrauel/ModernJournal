// This script loads the database with the initial data from
// ./initial_data. It is intended to be run from the command line
// with the command "node clear_db.js". This will DESTROY ALL DATA
// in the database!

const fs = require('fs');
const {MongoClient} = require('mongodb');
const secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));
const mongoClient = new MongoClient(secrets.db_uri, {useNewUrlParser: true});
const db = mongoClient.db(secrets.db_name);

const prompt = require('prompt-sync')({sigint: true});


// Tell the user that we are about to DESTROY THE DATABASE
// Get very clear confirmation

console.log("");
console.log("#######################################################")
console.log("");
console.log('This script will DESTROY ALL DATA in the database at:');
console.log("");
console.log(`    ${secrets.db_uri}/${secrets.db_name}`);
console.log("");
console.log('Are you sure you want to do this?');
console.log('Type "yes" to continue, or anything else to cancel.');
let answer = prompt('  > ');
console.log("");

if (answer !== 'yes') {
    console.log('Aborting.');
    process.exit(0);
}


// Nuke it from orbit

async function clearDB() {
    try {
        console.log("Checking to make sure DB already exists...");
        let dbs = await mongoClient.db().admin().listDatabases();

        if (!dbs.databases.find(db => db.name === secrets.db_name)) {
            console.log(`Database ${secrets.db_name} does not exist! We'll create it.`);
        } else {
            console.log("Dropping DB...");
            await db.dropDatabase();
            console.log('Database cleared!');
        }

        let USERS = require('./initial_data/users');
        let SESSIONS = require('./initial_data/sessions');

        console.log("Inserting initial data...");

        await db.collection('users').insertMany(USERS);
        await db.collection('sessions').insertMany(SESSIONS);

        console.log("Building indices...");

        await db.collection('users').createIndex({email: 1}, {unique: true});

        await db.collection('sessions').createIndex({session_id: 1}, {unique: true});
        await db.collection('sessions').createIndex({expires: 1});
        await db.collection('sessions').createIndex({user: 1});

        console.log("Done!");

    } finally {
        await mongoClient.close();
    }
}

clearDB();