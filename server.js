const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const bcrypt = require('bcrypt');

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

const createTableUsers = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,        
        password TEXT,
        profilePicture LONGBLOB,
        isAdmin BOOLEAN              
    )
`;

const createTableEmails= `
    CREATE TABLE IF NOT EXISTS emails (
        email TEXT PRIMARY KEY,
        userId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
    )
`;



const insertIntoTableThreads = `
    INSERT INTO thread (title, creator)
    VALUES (?, ?)
`;

const createTablePost = `
    CREATE TABLE IF NOT EXISTS post (
        post_id INT PRIMARY KEY AUTO_INCREMENT,
        text VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creator INTEGER,
        FOREIGN KEY (creator) REFERENCES users(id)
    )
`

const insertIntoTablePost = `
    INSERT INTO post(text, creator)
`;

const insertUserQuery = `
    INSERT INTO users (username, password, profilePicture)
    VALUES(?, ?, ?)
`;

const insertEmailQuery = `
    INSERT INTO emails (email, userId)
    VALUES(?, ?)
`;

const createTableThreads = `
    CREATE TABLE IF NOT EXISTS thread (
        thread_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creator INTEGER,
        last_user_posted INTEGER,
        FOREIGN KEY (creator) REFERENCES users(id),
        FOREIGN KEY (last_user_posted) REFERENCES users(id)
    )
`;

const insertThreadQuery = `
    INSERT INTO thread (title, created_at, last_posted, creator, last_user_posted)
    VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
`;

db.run(createTableUsers, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Users table created succesfully');
    }
})

db.run(createTableEmails, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Emails table created succesfully');
    }
})

db.run(createTableThreads, (err) => {
    if(err) {
        console.error(err);
    } else {
        console.log('Threads table created succesfully');
    }
})

const firstUser = {
    username: 'uglyshiba',
    email: 'uglyshiba@example.com',
    password: '1234',
    isAdmin: false
};


app.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, password, email } = req.body;
    const profilePicture = req.file.buffer;
    res.setHeader('Content-type', 'application/json');

    try {
        const encryptedPassword = await encryptPassword(password);

        await runTransactionQuery('BEGIN');

        const insertUser = await runChangeQuery(insertUserQuery, [username, encryptedPassword, profilePicture]);

        const userId = insertUser.lastID;

        await runChangeQuery(insertEmailQuery, [email, userId]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({success: 'User registered successfully'});

    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK').catch(rollbackErr => {
            console.error('Rollback failed: ', rollbackErr);
        });
        if(err.message.includes('username')) {
            res.status(400).json({error: 'Username already exists'});
        } else if(err.message.includes('email')) {
            res.status(400).json({error: 'Email is already taken'});
        } else {
            res.status(400).json({error: 'Something got very wrong during checking uniqueness of username and email'});
        }
    }
});

app.post('/login', async(req, res) => {
    const {username, password} = req.body;

    try{
        const query = 'SELECT * FROM users WHERE username=?';
        const searchResult = await runSelectQuery(query, [username]);
        if(searchResult.length < 1) {
            res.status(404).json({error: 'User not found'});
        } else {
            const passwordMatch = await bcrypt.compare(password, searchResult[0].password);

            if(passwordMatch) {
                req.session.user = {
                    id: searchResult[0].id,
                    user: searchResult[0].username,
                    isAdmin: searchResult[0].isAdmin
                }
                res.status(200).json({success: 'Login successful!'});
            } else {
                res.status(401).json({error: 'Wrong password'});
            }
        }
    } catch {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
})

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
        let updateUserQuery = 'UPDATE users SET';
        let updateEmailQuery = 'UPDATE emails SET';
        const whereUserQuery = `WHERE id = ${userId}`;
        const whereEmailQuery = `WHERE userId = ${userId}`;
        let successMessage = '';
        if(username) {
            updateUserQuery += ` username = '${username}' ,`;
        }
        if(password) {
            updateUserQuery += ` password = '${password}' ,`;
        }
        if(profilePicture) {
            updateUserQuery += ` profilePicture = '${profilePicture}' ,`;
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

app.get('/users/:id?', async (req, res) => {
    const userId = req.params.id;

    try{
        if(userId) {
            const getUserQuery = `
            SELECT users.id, users.username, emails.email FROM users
            LEFT JOIN emails ON users.id = emails.userId
            WHERE users.id = ?
        `;
            const user = await runSelectQuery(getUserQuery, [userId]);

            if(user.length === 0) {
                res.status(404).json({error: 'User not found'});
            } else {
                res.status(200).json(user[0]);
            }
        } else {
            const getAllUsersQuery = `
                SELECT users.id, users.username, users.profilePicture, emails.email FROM users
                JOIN emails ON users.id = emails.userId
            `;

            const allUsers = await runSelectQuery(getAllUsersQuery);

            const usersWithBase64 = allUsers.map(user => {
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture.toString('base64')
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
            DELETE FROM emails WHERE userId = ?
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
