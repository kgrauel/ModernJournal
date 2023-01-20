// This script loads the database with the initial data from
// ./initial_data. It is intended to be run from the command line
// with the command "node clear_db.js". This will DESTROY ALL DATA
// in the database!


const prompt = require('prompt-sync')({sigint: true});

const cla = require('command-line-args');
const optionDefinitions = [
    { name: 'secrets', alias: 's', type: String, defaultValue: './secrets.json' },
    { name: 'force', alias: 'f', type: Boolean, defaultValue: false }
];
const options = cla(optionDefinitions);

// Load the secrets

const getSecrets = require('./secrets.js');
const secrets = getSecrets(options.secrets);
if (!secrets) {
    console.error('Error loading secrets. Aborting.');
    process.exit(1);
} else {
    console.log("(Using secrets from " + options.secrets + ")");
}

// Tell the user that we are about to DESTROY THE DATABASE
// Get very clear confirmation

if (!options.force) {
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
}
else {
    console.log("(Force mode enabled. Skipping confirmation.)");
}


// Nuke it from orbit
const nuke_database = require('./initial_data/nuke_database.js');
nuke_database(secrets);

