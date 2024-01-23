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

module.exports = {
    createTableUser,
    createTableEmail,
    insertUserQuery,
    insertEmailQuery,
    createTableThread,
    insertThreadQuery,
    createTableComment,
    insertCommentQuery,
    createDeletedUser,
};