import db from './database'; // Will resolve to database.ts
import bcrypt from 'bcrypt';
import { Database, RunResult } from 'sqlite3'; // Specific types

const saltRounds = 10;

// --- Interfaces ---
interface User {
    id: number;
    username: string;
    email: string;
    created_at?: string; // Comes from DB
}

interface UserWithPasswordHash extends User {
    password_hash: string;
}

interface NewUserParams {
    username: string;
    email: string;
    // password is plain text here
}

interface UserUpdateParams {
    email?: string;
    password?: string; // Plain text, will be hashed
}

interface UserService {
    addUser: (username: string, email: string, passwordPlainText: string) => Promise<User>;
    getUserById: (id: number) => Promise<User | null>;
    getUserByUsername: (username: string) => Promise<User | null>;
    updateUser: (id: number, updates: UserUpdateParams) => Promise<{ id: number; changes: number } | null>;
    deleteUser: (id: number) => Promise<{ id: number; deleted: number } | null>;
}

// --- Service Implementation ---
const userService: UserService = {
    addUser: (username, email, passwordPlainText) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(passwordPlainText, saltRounds, (err: Error | undefined, hash: string) => {
                if (err) {
                    return reject(err);
                }
                const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
                const params = [username, email, hash];
                
                // Explicitly type 'this' for RunResult context
                (db as Database).run(sql, params, function(this: RunResult, err: Error | null) {
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
            (db as Database).get(sql, [id], (err: Error | null, row?: User) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    },

    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id, username, email, created_at FROM users WHERE username = ?";
            (db as Database).get(sql, [username], (err: Error | null, row?: User) => {
                if (err) {
                    return reject(err);
                }
                resolve(row || null);
            });
        });
    },

    updateUser: (id, { email, password: passwordPlainText }) => {
        return new Promise(async (resolve, reject) => {
            if (!email && !passwordPlainText) {
                return reject(new Error("No fields to update (email or password required)."));
            }

            let sql = 'UPDATE users SET ';
            const params: any[] = []; // Using any[] for params flexibility
            const setClauses: string[] = [];

            if (email) {
                setClauses.push('email = ?');
                params.push(email);
            }

            if (passwordPlainText) {
                try {
                    const hash = await bcrypt.hash(passwordPlainText, saltRounds);
                    setClauses.push('password_hash = ?');
                    params.push(hash);
                } catch (err) {
                    return reject(err as Error);
                }
            }

            sql += setClauses.join(', ') + ' WHERE id = ?';
            params.push(id);

            (db as Database).run(sql, params, function(this: RunResult, err: Error | null) {
                if (err) {
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); 
                }
                resolve({ id, changes: this.changes });
            });
        });
    },

    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE id = ?';
            (db as Database).run(sql, [id], function(this: RunResult, err: Error | null) {
                if (err) {
                    return reject(err);
                }
                if (this.changes === 0) {
                    return resolve(null); 
                }
                resolve({ id, deleted: this.changes });
            });
        });
    }
};

export default userService;
export type { User, NewUserParams, UserUpdateParams, UserService }; // Export types
