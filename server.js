const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

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

const insertIntoTableComment = `
    INSERT INTO comment(text, created_at, creator, thread)
    VALUES(?, CURRENT_TIMESTAMP, ?, ?)
`;

db.run(createTableUser, (err) => {
    if(err) {
        console.error(err);
    } else {
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

        const uid = uuid.v4();
        const insertUser = await runChangeQuery(insertUserQuery, [uid, username, encryptedPassword, profilePicture]);
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
        return res.status(401).json({ error: 'Only logged in users can create threads' });
    }
    next();
};
app.post('/create-thread', requireLogin, async(req, res) => {
    const {threadName, threadText} = req.body;
    try{

        const {id: userId, user:username} =req.session.user;
        await runTransactionQuery('BEGIN');

        const createThreadResult = await runChangeQuery(insertThreadQuery, [threadName, userId, userId]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({success: 'Thread created successfully'});

    } catch (err) {
        console.log(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({success: 'Failed to create thread'});
        //res.status(501).json({error: 'Internal server error during thread creation'});
    }
})

app.post('/thread/:id/create-comment', requireLogin, async (req, res) => {
    const threadId = req.params.id;
    const { text } = req.body;

    try {
        const { id: userId } = req.session.user;

        await runTransactionQuery('BEGIN');

        // Check if 'create-comment' query parameter is present
        if (req.query.createComment) {
            // Insert the comment into the post table
            const insertCommentResult = await runChangeQuery(insertIntoTableComment, [text, userId, threadId]);

            const updateThreadQuery = `
                UPDATE thread
                SET last_user_posted = ?,
                    last_posted = CURRENT_TIMESTAMP
                WHERE thread_id = ?;
            `;
            await runChangeQuery(updateThreadQuery, [userId, threadId]);

            await runTransactionQuery('COMMIT');

            res.status(200).json({
                success: 'Comment created successfully'
            });
        } else {
            const fetchThreadPathQuery = `
                SELECT thread_id, title
                FROM thread
                WHERE thread_id = ?;
            `;
            const fetchThreadPathResult = await runSelectQuery(fetchThreadPathQuery, [threadId]);
            const threadPath = fetchThreadPathResult[0];

            await runTransactionQuery('COMMIT');

            res.status(200).json({
                success: 'Thread information retrieved successfully',
                threadPath: threadPath
            });
        }

    } catch (err) {
        console.log(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to process request' });
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
    const userId = req.params.username;

    try{
        if(userId) {
            const getUserQuery = `
            SELECT user.id, user.username, email.email FROM user
            LEFT JOIN email ON user.id = email.user_id
            WHERE user.id = ?
        `;
            const user = await runSelectQuery(getUserQuery, [userId]);

            if(user.length === 0) {
                res.status(404).json({error: 'User not found'});
            } else {
                res.status(200).json(user[0]);
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

        const deleteEmailQuery = `
            DELETE FROM emails WHERE user_id = ?
        `

        await runChangeQuery(deleteEmailQuery, [userId]);

        const deleteUserQuery = `
            DELETE FROM users WHERE id = ?
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
