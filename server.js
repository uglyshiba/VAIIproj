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
const runInsertQuery = (query, values) => {
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

    // Convert the binary data to a buffer
    let success = false;

    try {
        await runTransactionQuery('BEGIN TRANSACTION');

        const insertUser = await runInsertQuery(insertUserQuery, [username, password, profilePicture]);

        const userId = insertUser.lastID;

        await runInsertQuery(insertEmailQuery, [email, userId]);

        await runTransactionQuery('COMMIT');
        success = true;

    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK').catch(rollbackErr => {
            console.error('Rollback failed: ', rollbackErr);
        });
    } finally {
        if (success) {
            res.status(200).send('User registered successfully');
        } else {
            res.status(500).send('Internal server error');
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

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})
