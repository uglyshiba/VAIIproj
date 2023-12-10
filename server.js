const express = require('express');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const app = express();
app.use(express.static('public'));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
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

const insertUserQuery = `
    INSERT INTO users (username, password, profilePicture)
    VALUES(?, ?, ?)
`;

const insertEmailQuery = `
    INSERT INTO emails (email, userId)
    VALUES(?, ?)
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
        await runTransactionQuery('BEGIN TRANSACTION');

        const insertUser = await runChangeQuery(insertUserQuery, [username, password, profilePicture]);

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
