const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const sharp = require('sharp');

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 3600000
    }
}))

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});




const db = new sqlite3.Database('userDatabase.db');

const PORT = 3000;

const runTransactionQuery = (query) => {
    return new Promise((resolve, reject) => {
        db.run(query, function(err) {
            if(err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};
const runChangeQuery = (query, values) => {
    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};
const runSelectQuery = (query, values) => {
    return new Promise((resolve, reject) => {
        db.all(query, values, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

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

const createTableUser = `
    CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,    
        username TEXT UNIQUE,
        password TEXT,
        profile_picture BLOB,
        is_admin BOOLEAN
    )
`;

const createTableEmail = `
    CREATE TABLE IF NOT EXISTS email (
        email TEXT PRIMARY KEY,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user(id)
        )
`;

const insertUserQuery = `
    INSERT INTO user (id, username, password, profile_picture)
    VALUES(?, ?, ?, ?)
`;

const insertEmailQuery = `
    INSERT INTO email (email, user_id)
    VALUES(?, ?)
`;

const createTableThread = `
    CREATE TABLE IF NOT EXISTS thread (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creator TEXT,
        last_user_posted TEXT,
        FOREIGN KEY (creator) REFERENCES user(id),
        FOREIGN KEY (last_user_posted) REFERENCES user(id)
        )
`;

const insertThreadQuery = `
    INSERT INTO thread (title, created_at, last_posted, creator, last_user_posted)
    VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
`;

const createTableComment = `
    CREATE TABLE IF NOT EXISTS comment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creator TEXT,
        thread INTEGER,
        FOREIGN KEY (creator) REFERENCES user(id),
        FOREIGN KEY (thread) REFERENCES thread(id)
        )
`

const insertCommentQuery = `
    INSERT INTO comment(text, created_at, creator, thread)
    VALUES(?, CURRENT_TIMESTAMP, ?, ?)
`;

const createDeletedUser = `
    INSERT OR IGNORE INTO user (id, username, password, profile_picture, is_admin)
    VALUES('defaultUserId', 'Deleted User', 'donteventhinkaboutthatbuddy', NULL, 0)
`;

db.run(createTableUser, (err) => {
    if(err) {
        console.error(err);
    } else {
        db.run(createDeletedUser, (err) => {
            if(err) {
                console.error(err);
            } else {
                console.log("Deleted user created successfully");
            }
        })
        console.log('Users table created succesfully');
    }
})

db.run(createTableEmail, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Emails table created succesfully');
    }
})

db.run(createTableThread, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Threads table created succesfully');
    }
})

db.run(createTableComment, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Comments table created succesfully');
    }
})

app.post('/register', upload.single('profilePicture'), async (req, res) => {
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
        const insertUser = await runChangeQuery(insertUserQuery, [uid, username, encryptedPassword, resizedImageBuffer]);
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

app.post('/login', async (req, res) => {
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

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User is not logged in' });
    }
    next();
};


app.post('/logout', requireLogin, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Internal Server Error during logout'});
        } else {
            res.status(200).json({ success: 'Logout successful' });
        }
    });
});

app.get('/check-login', requireLogin, async (req, res) => {
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

app.post('/create-thread', requireLogin, async(req, res) => {
    const {threadName, threadText} = req.body;
    try{

        const {id: userId, user:username} =req.session.user;
        await runTransactionQuery('BEGIN');

        const createThreadResult = await runChangeQuery(insertThreadQuery, [threadName, userId, userId]);
        const threadId = createThreadResult.lastID;
        await runChangeQuery(insertCommentQuery, [threadText, userId, threadId]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({success: 'Thread created successfully'});

    } catch (err) {
        console.log(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({success: 'Failed to create thread'});
    }
})

app.post('/thread/:id/create-comment', requireLogin, async (req, res) => {
    const threadId = req.params.id;
    const { text } = req.body;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const insertCommentResult = await runChangeQuery(insertCommentQuery, [text, userId, threadId]);

            const updateThreadQuery = `
                UPDATE thread
                SET last_user_posted = ?,
                    last_posted = CURRENT_TIMESTAMP
                WHERE id = ?;
            `;
            await runChangeQuery(updateThreadQuery, [userId, threadId]);

            await runTransactionQuery('COMMIT');

            res.status(200).json({
                success: 'Comment created successfully'
            });
    } catch (err) {
        console.log(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.put('/thread/:threadId/update-comment/:commentId', requireLogin, async (req, res) => {
    const threadId = req.params.threadId;
    const commentId = req.params.commentId;
    const { text } = req.body;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const updateCommentQuery = `
            UPDATE comment
            SET text = ?
            WHERE id = ? AND creator = ? AND thread = ?;
        `;
        await runChangeQuery(updateCommentQuery, [text, commentId, userId, threadId]);
        await runTransactionQuery('COMMIT');

        res.status(200).json({ success: 'Comment updated successfully' });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

app.delete('/thread/:threadId/delete-comment/:commentId', requireLogin, async (req, res) => {
    const threadId = req.params.threadId;
    const commentId = req.params.commentId;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const deleteCommentQuery = `
            DELETE FROM comment
            WHERE id = ? AND creator = ? AND thread = ?;
        `;
        await runChangeQuery(deleteCommentQuery, [commentId, userId, threadId]);
        await runTransactionQuery('COMMIT');

        res.status(200).json({ success: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

app.get('/thread/:id', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const offset = (page - 1) * limit;
    const threadId = req.params.id;

    const searchThreadQuery = `
            SELECT c.id as comment_id, c.text, c.created_at as comment_created_at, c.creator as comment_creator,
                t.id as thread_id, t.title, t.created_at as thread_created_at,
                u.username as creator_username, u.profile_picture as pfp
            FROM comment c
                JOIN thread t ON c.thread = t.id
                JOIN user u ON c.creator = u.id
            WHERE t.id = ?
            ORDER BY c.created_at ASC
            LIMIT 10 OFFSET ?;
    `;

    const fetchThreadResult = await runSelectQuery(searchThreadQuery, [threadId, offset]);

    const threadResult = fetchThreadResult.map(row => ({
        commentId: row.comment_id,
        text: row.text,
        commentCreatedAt: row.comment_created_at,
        creatorId: row.comment_creator,
        threadId: row.thread_id,
        title: row.title,
        threadCreatedAt: row.thread_created_at,
        creatorUsername: row.creator_username,
        profilePicture: row.pfp ? row.pfp.toString('base64') : null
    }));

    res.status(200).json({
        success: 'Thread information retrieved successfully',
        threadPath: threadResult
    });
})

app.get('/recent-threads', async (req, res) => {
    try {
        const recentThreadsQuery = `
            SELECT threads.id as threadId, threads.title as threadName,
                   comments.text as lastCommentText, users.username as lastCommentCreator
            FROM thread threads
                     LEFT JOIN (
                SELECT thread, text, creator
                FROM comment
                ORDER BY created_at DESC
                    LIMIT 1
            ) comments ON threads.id = comments.thread
                     LEFT JOIN user users ON comments.creator = users.id
            ORDER BY threads.created_at DESC
                LIMIT 10;
        `;
        const recentThreads = await runSelectQuery(recentThreadsQuery);

        res.json({ success: true, recentThreads });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recent threads' });
    }
});

app.get('/renew-session', (req, res) => {
    if (req.session.user) {
        req.session.touch();
        res.status(200).json({ success: 'Session renewed successfully' });
    } else {
        res.status(400).json({ error: 'Session does not exist' });
    }
});

app.put('/update/:id', async(req, res) => {
    const userId = req.params.id;
    console.log(req.body);
    const {username, email, password, profilePicture} = req.body;
    try{
        let updateUserQuery = 'UPDATE user SET';
        let updateEmailQuery = 'UPDATE email SET';
        const whereUserQuery = `WHERE id = ${userId}`;
        const whereEmailQuery = `WHERE user_id = ${userId}`;
        let successMessage = '';
        if(username) {
            updateUserQuery += ` username = '${username}' ,`;
        }
        if(password) {
            updateUserQuery += ` password = '${password}' ,`;
        }
        if(profilePicture) {
            updateUserQuery += ` profile_picture = '${profilePicture}' ,`;
        }
        if(email) {
            updateEmailQuery += ` email = '${email}' ,`;
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

app.get('/users/:username?', async (req, res) => {
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
        console.error(error);
        res.status(500).send('Error retrieving user(s)');
    }
})

app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try{
        await runTransactionQuery('BEGIN TRANSACTION');

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
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})
