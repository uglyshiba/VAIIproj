const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const bcrypt = require("bcrypt");
const sharp = require("sharp");

const { insertUserQuery, insertEmailQuery,  } = require("./databaseQueries");
const { runChangeQuery, runSelectQuery, runTransactionQuery } = require("./databaseFunctions");
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, password, email } = req.body;
    const profilePicture = req.file.buffer;
    res.setHeader('Content-type', 'application/json');

    try {
        const encryptedPassword = await encryptPassword(password);

        await runTransactionQuery('BEGIN');

        const resizedImageBuffer = await sharp(profilePicture)
            .resize({ width: 100, height: 100, fit: sharp.fit.inside })
            .toBuffer();

        const uid = uuid.v4();
        await runChangeQuery(insertUserQuery, [uid, username, encryptedPassword, resizedImageBuffer]);
        await runChangeQuery(insertEmailQuery, [email, uid]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({ success: 'User registered successfully' });

    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK').catch(rollbackErr => {
            console.error('Rollback failed: ', rollbackErr);
        });
        if (err.message.includes('username')) {
            res.status(400).json({ error: 'Username already exists' });
        } else if (err.message.includes('email')) {
            res.status(400).json({ error: 'Email is already taken' });
        } else {
            res.status(400).json({ error: 'Something got very wrong during checking uniqueness of username and email' });
        }
    }
});

router.put('/update/:username/makeAdmin', async(req, res) => {
    if(!req.session.is_admin) {
        res.status(401).json({ error: 'Only admins can make others an admin'});
    }

    const username = req.params.username;

    try{
        const setAdminQuery = `
            UPDATE user SET is_admin = 1 WHERE username = ?
        `;
        await runTransactionQuery('BEGIN TRANSACTION');
        await runChangeQuery(setAdminQuery, [username]);
        await runTransactionQuery('COMMIT');
        res.status(200).json({ success: 'User is now an admin'});
    } catch (err) {
        await runTransactionQuery('ROLLBACK');
        console.log('Error updating admin status', err)
        res.status(500).json({error: "Error during setting admin"});
    }
})

router.put('/update/:username', async(req, res) => {
    const username = req.params.username;
    const getIdQuery = `
        SELECT id FROM user WHERE username = ?
    `
    const queryResult = await runSelectQuery(getIdQuery, [username]);

    const {newUsername, newEmail, newPassword, profilePicture} = req.body;
    try{
        let updateUserQuery = 'UPDATE user SET';
        let updateEmailQuery = 'UPDATE email SET';
        const whereUserQuery = `WHERE id = "${queryResult[0].id}"`;
        const whereEmailQuery = `WHERE user_id = "${queryResult[0].id}"`;
        let successMessage = '';
        if(newUsername) {
            updateUserQuery += ` username = '${newUsername}' ,`;
        }
        if(newPassword) {
            updateUserQuery += ` password = '${await encryptPassword(newPassword)}' ,`;
        }
        if(profilePicture) {
            updateUserQuery += ` profile_picture = '${profilePicture}' ,`;
        }
        if(newEmail) {
            updateEmailQuery += ` email = '${newEmail}' ,`;
        }

        if(updateUserQuery.endsWith(',')) {
            updateUserQuery = updateUserQuery.slice(0,-1);
            updateUserQuery += whereUserQuery;
            await runTransactionQuery('BEGIN TRANSACTION');
            await runChangeQuery(updateUserQuery);
            await runTransactionQuery('COMMIT')
            successMessage += 'User updated successfully. ';
        }

        if(updateEmailQuery.endsWith(',')) {
            updateEmailQuery = updateEmailQuery.slice(0, -1);
            updateEmailQuery += whereEmailQuery;
            await runTransactionQuery('BEGIN TRANSACTION');
            await runChangeQuery(updateEmailQuery);
            await runTransactionQuery('COMMIT');
            successMessage += 'Email updated successfully'
        }
        res.status(200).json({ success: successMessage});

    } catch (err) {
        await runTransactionQuery('ROLLBACK').catch(rollbackErr => {
            console.error('Rollback failed: ' + rollbackErr);
        })
        if(err.message.includes('username')) {
            res.status(400).json({error: 'Username already exists'});
        } else if(err.message.includes('email')) {
            res.status(400).json({error: 'Email is already taken'});
        } else {
            res.status(400).json({error: 'Something got very wrong during updating username or email'});
        }
    }
})

router.get('/users/:username?', async (req, res) => {
    const username = req.params.username;

    try{
        if(username) {
            if(username === "Deleted profile") {
                res.status(403).json({error: 'You should not have done that'});
            }
            const getUserQuery = `
            SELECT user.id, user.username, user.profile_picture, email.email FROM user
            LEFT JOIN email ON user.id = email.user_id
            WHERE user.username = ?
        `;
            const user = await runSelectQuery(getUserQuery, [username]);

            if(user.length === 0) {
                res.status(404).json({error: 'User not found'});
            } else {
                const userWithBase64 = {
                    id: user[0].id,
                    username: user[0].username,
                    email: user[0].email,
                    profilePicture: user[0].profile_picture.toString('base64')
                };

                res.status(200).json(userWithBase64);
            }
        } else {
            const getAllUsersQuery = `
                SELECT user.id, user.username, user.profile_picture, email.email FROM user
                JOIN email ON user.id = email.user_id
            `;

            const allUsers = await runSelectQuery(getAllUsersQuery);

            const usersWithBase64 = allUsers.map(user => {
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profile_picture.toString('base64')
                };
            });

            res.status(200).json(usersWithBase64);
        }
    } catch(err) {
        console.error(err);
        res.status(500).send('Error retrieving user(s)');
    }
})

router.post('/users/verifyPassword', async (req, res) => {
    const oldPass = req.body.oldPass;
    if(oldPass) {
        const getPassQuery = `
            SELECT password FROM user WHERE id = ?
        `
        const queryResult = await runSelectQuery(getPassQuery, [req.session.user.id]);

        const compareResult = await bcrypt.compare(oldPass, queryResult[0].password);
        if(compareResult) {
            res.status(200).json({success: 'Password successfully verified'});
        } else {
            res.status(401).json({error: 'Incorrect password'});
        }
    }
})

router.delete('/users/:username', async (req, res) => {
    const username = req.params.username;

    try{
        await runTransactionQuery('BEGIN TRANSACTION');
        const findUserQuery = `
            SELECT id FROM user WHERE username = ?
        `;
        const queryResult  = await runSelectQuery(findUserQuery, [username]);
        if(queryResult.length === 0) {
            return res.status(404).json({ error: 'User not found during user deletion'});
        }
        const userId = queryResult[0].id;
        const updateCommentsQuery = `
            UPDATE comment SET creator = 'defaultUserId' WHERE creator = ?;
        `;
        await runChangeQuery(updateCommentsQuery, [userId]);


        const deleteEmailQuery = `
            DELETE FROM email WHERE user_id = ?
        `

        await runChangeQuery(deleteEmailQuery, [userId]);

        const deleteUserQuery = `
            DELETE FROM user WHERE id = ?
        `

        await runChangeQuery(deleteUserQuery, [userId]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({success : 'User deleted succesfully'});

    } catch (err) {
        await runTransactionQuery('ROLLBACK').catch(rollbackErr => {
            console.error('Rollback failed: ', rollbackErr);
        });
        res.status(500).json({ error: err });
    }
});

const encryptPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, encryptedPassword) => {
            if(err) {
                reject(err);
            } else {
                resolve(encryptedPassword);
            }
        })
    })
}

module.exports = router;
module.exports.encryptPassword = encryptPassword;