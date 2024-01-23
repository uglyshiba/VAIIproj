const bcrypt = require("bcrypt");
const express = require('express');
const router = express.Router();

const { requireLogin, runSelectQuery } = require('./databaseFunctions');
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM user WHERE username=?';
        const searchResult = await runSelectQuery(query, [username]);
        if (searchResult.length < 1) {
            res.status(404).json({ error: 'User not found' });
        } else {
            const passwordMatch = await bcrypt.compare(password, searchResult[0].password);

            if (passwordMatch) {
                req.session.user = {
                    id: searchResult[0].id,
                    user: searchResult[0].username,
                    isAdmin: searchResult[0].is_admin
                };
                res.status(200).json({ success: 'Login successful!' });
            } else {
                res.status(401).json({ error: 'Wrong password' });
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', requireLogin, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Internal Server Error during logout'});
        } else {
            res.status(200).json({ success: 'Logout successful' });
        }
    });
});

router.get('/check-login', requireLogin, async (req, res) => {
    try{
        const searchUserQuery = `
        SELECT username, profile_picture, id FROM user
        WHERE id = ?
        `;

        const searchUserResult = await runSelectQuery(searchUserQuery, [req.session.user.id])

        if(searchUserResult.length > 0) {
            res.status(200).json({
                username: searchUserResult[0].username,
                profilePicture: searchUserResult[0].profile_picture.toString('base64'),
                id: searchUserResult[0].id
            });
        } else {
            res.status(404).json({ error: 'During checking of login session, user was not found'});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error during checking user login session'});
    }
});

router.get('/renew-session', (req, res) => {
    if (req.session.user) {
        req.session.touch();
        res.status(200).json({ success: 'Session renewed successfully' });
    } else {
        res.status(400).json({ error: 'Session does not exist' });
    }
});

module.exports = router;