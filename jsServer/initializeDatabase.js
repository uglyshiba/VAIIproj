const {
    createTableUser,
    createTableEmail,
    createTableThread,
    createTableComment,
    createDeletedUser,
} = require('./databaseQueries');
const { encryptPassword } = require('./userManipulationPaths');
const sqlite3 = require('sqlite3');
const {runChangeQuery, runTransactionQuery} = require("./databaseFunctions");

const db = new sqlite3.Database('userDatabase.db');
async function initializeAdmin() {
    try {
        // Encrypt the password
        const adminPassword = await encryptPassword('keksik1507');

        // Prepare the insert query with a parameter for the password
        const insertAdminQuery = `
            INSERT OR IGNORE INTO user (id, username, email, password, profile_picture, is_admin) 
            VALUES('adminId', 'admin', 'admin@gmail.com', ?, NULL, 1)
        `;

        // Run the insert query with the encrypted password as a parameter
        await runChangeQuery(insertAdminQuery, [adminPassword]);

        console.log('Admin user created successfully');
    } catch (err) {
        console.error('Error initializing admin user:', err);
    }
}

function initializeDatabaseTables() {
    db.run(createTableUser, async (err) => {
        if (err) {
            console.error(err);
        } else {
            db.run(createDeletedUser, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Deleted user created successfully");
                }
            })
            console.log('Users table created successfully');
        }
    })

    db.run(createTableEmail, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Emails table created successfully');
        }
    })

    db.run(createTableThread, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Threads table created successfully');
        }
    })

    db.run(createTableComment, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Comments table created successfully');
        }
    })
}

module.exports = { db, initializeDatabaseTables, initializeAdmin };