const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

//const SQLiteStore = require('connect-sqlite3')(session);
const { initializeDatabaseTables } = require('./initializeDatabase');

const userManipulationPaths = require('./userManipulationPaths');
const loginManipulationPaths = require('./loginManipulationPaths');
const threadManipulationPaths = require('./threadManipulationPaths');
const commentManipulationPaths = require('./commentManipulationPaths');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    //store: new SQLiteStore({ db: 'userDatabase.db' }),
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 3600000
    }
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.send();
});


// Initialize database tables
initializeDatabaseTables();

app.use(userManipulationPaths);
app.use(loginManipulationPaths);
app.use(threadManipulationPaths);
app.use(commentManipulationPaths);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
