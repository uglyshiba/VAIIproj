const {
    createTableUser,
    createTableEmail,
    createTableThread,
    createTableComment,
    createDeletedUser,
    insertAdminQuery
} = require('./databaseQueries');
//const { encryptPassword } = require('./userManipulationPaths');
const sqlite3 = require('sqlite3');
const sharp = require("sharp");
const fs = require('fs');

const db = new sqlite3.Database('userDatabase.db');

async function initializeDatabaseTables(encryptPassword) {
    db.run(createTableUser, async (err) => {
        if (err) {
            console.error(err);
        } else {
            try {
                // Read and process deleted user profile picture
                let profilePicture = fs.readFileSync('./resources/deleted_user_pfp.png');
                let resizedImageBuffer = await sharp(profilePicture)
                    .resize({ width: 100, height: 100, fit: sharp.fit.inside })
                    .toBuffer();

                // Insert deleted user
                db.run(createDeletedUser, [resizedImageBuffer], (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("Deleted user created successfully");
                    }
                });

                // Encrypt admin password
                const adminPassword = await encryptPassword('keksik1507');

                // Read and process admin profile picture
                profilePicture = fs.readFileSync('./resources/admin_icon.jpg');
                resizedImageBuffer = await sharp(profilePicture)
                    .resize({ width: 100, height: 100, fit: sharp.fit.inside })
                    .toBuffer();

                // Insert admin
                db.run(insertAdminQuery, [adminPassword, resizedImageBuffer], (err) => {
                    if(err) {
                        console.error(err);
                    } else {
                        console.log('Admin created successfully');
                    }
                });

                console.log('Users table created successfully');
            } catch (error) {
                console.error("Error during initialization:", error);
            }
        }
    });

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