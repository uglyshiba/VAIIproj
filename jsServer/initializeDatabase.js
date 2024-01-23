const {
    createTableUser,
    createTableEmail,
    createTableThread,
    createTableComment,
    createDeletedUser,
} = require('./databaseQueries');

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('userDatabase.db');

function initializeDatabaseTables() {
    db.run(createTableUser, (err) => {
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

module.exports = { db, initializeDatabaseTables };