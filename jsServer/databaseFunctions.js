const { db } = require('./initializeDatabase');
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

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User is not logged in' });
    }
    next();
};


module.exports = {runChangeQuery, runSelectQuery, runTransactionQuery, requireLogin};