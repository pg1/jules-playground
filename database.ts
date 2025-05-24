import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DBSOURCE is constructed to point to users.db in the project root,
// assuming this script (database.ts) is compiled into the 'dist' directory.
const DBSOURCE = path.join(__dirname, '..', 'users.db');

// Use verbose for more detailed error messages
const verboseSqlite3 = sqlite3.verbose();

const db = new verboseSqlite3.Database(DBSOURCE, (err: Error | null) => {
    if (err) {
        console.error("Error opening database:", err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err: Error | null) => {
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

export default db;
