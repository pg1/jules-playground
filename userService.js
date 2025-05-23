const db = require('./database.js');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Standard practice for bcrypt

const userService = {
    addUser: (username, email, password) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) {
                    return reject(err);
                }
                const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
                const params = [username, email, hash];
                db.run(sql, params, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ id: this.lastID, username, email });
                });
            });
        });
    },

    getUserById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, username, email, created_at FROM users WHERE id = ?";
            db.get(sql, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    },

    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, username, email, created_at FROM users WHERE username = ?";
            db.get(sql, [username], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    },

    updateUser: (id, { email, password }) => {
        return new Promise(async (resolve, reject) => {
            if (!email && !password) {
                return reject(new Error("No fields to update (email or password required)."));
            }

            let sql = 'UPDATE users SET ';
            const params = [];
            const setClauses = [];

            if (email) {
                setClauses.push('email = ?');
                params.push(email);
            }

            if (password) {
                try {
                    const hash = await bcrypt.hash(password, saltRounds);
                    setClauses.push('password_hash = ?');
                    params.push(hash);
                } catch (err) {
                    return reject(err);
                }
            }

            sql += setClauses.join(', ') + ' WHERE id = ?';
            params.push(id);

            db.run(sql, params, function(err) {
                if (err) {
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); // No user found or no changes made
                }
                resolve({ id, changes: this.changes });
            });
        });
    },

    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) {
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); // No user found
                }
                resolve({ id, deleted: this.changes });
            });
        });
    }
};

module.exports = userService;
