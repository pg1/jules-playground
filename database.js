const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "users.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                // Table already created or other error
                console.error("Error creating users table:", err.message);
            } else {
                // Table just created or already exists
                console.log("Users table ready.");
            }
        });
    }
});

module.exports = db;
