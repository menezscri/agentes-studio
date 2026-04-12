"""
Database layer for SplitZ - SQLite via Python stdlib.
All monetary amounts stored in cents (integers).
"""
import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "splitz.db")


def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                email       TEXT    UNIQUE NOT NULL,
                name        TEXT    NOT NULL,
                password_hash TEXT  NOT NULL,
                created_at  INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS friend_requests (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                from_user_id INTEGER NOT NULL REFERENCES users(id),
                to_user_id   INTEGER NOT NULL REFERENCES users(id),
                status       TEXT    NOT NULL DEFAULT 'pending',
                created_at   INTEGER NOT NULL,
                UNIQUE(from_user_id, to_user_id)
            );

            CREATE TABLE IF NOT EXISTS friendships (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                friend_id  INTEGER NOT NULL REFERENCES users(id),
                created_at INTEGER NOT NULL,
                UNIQUE(user_id, friend_id)
            );

            CREATE TABLE IF NOT EXISTS groups (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                description TEXT,
                created_by  INTEGER NOT NULL REFERENCES users(id),
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS group_members (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id  INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                user_id   INTEGER NOT NULL REFERENCES users(id),
                joined_at INTEGER NOT NULL,
                role      TEXT    NOT NULL DEFAULT 'member',
                UNIQUE(group_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS expenses (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                title       TEXT    NOT NULL,
                description TEXT,
                amount      INTEGER NOT NULL,
                currency    TEXT    NOT NULL DEFAULT 'BRL',
                paid_by     INTEGER NOT NULL REFERENCES users(id),
                split_type  TEXT    NOT NULL DEFAULT 'equal',
                expense_date INTEGER NOT NULL,
                created_by  INTEGER NOT NULL REFERENCES users(id),
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                is_deleted  INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS expense_splits (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                expense_id  INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
                user_id     INTEGER NOT NULL REFERENCES users(id),
                amount      INTEGER NOT NULL,
                percent     REAL,
                UNIQUE(expense_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS settlements (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id   INTEGER REFERENCES groups(id) ON DELETE CASCADE,
                from_user  INTEGER NOT NULL REFERENCES users(id),
                to_user    INTEGER NOT NULL REFERENCES users(id),
                amount     INTEGER NOT NULL,
                currency   TEXT    NOT NULL DEFAULT 'BRL',
                note       TEXT,
                created_by INTEGER NOT NULL REFERENCES users(id),
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity_log (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                type       TEXT    NOT NULL,
                actor_id   INTEGER NOT NULL REFERENCES users(id),
                target_id  INTEGER,
                group_id   INTEGER REFERENCES groups(id),
                metadata   TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
            CREATE INDEX IF NOT EXISTS idx_expenses_group     ON expenses(group_id);
            CREATE INDEX IF NOT EXISTS idx_expenses_paid_by   ON expenses(paid_by);
            CREATE INDEX IF NOT EXISTS idx_splits_expense     ON expense_splits(expense_id);
            CREATE INDEX IF NOT EXISTS idx_splits_user        ON expense_splits(user_id);
            CREATE INDEX IF NOT EXISTS idx_settlements_from   ON settlements(from_user);
            CREATE INDEX IF NOT EXISTS idx_settlements_to     ON settlements(to_user);
            CREATE INDEX IF NOT EXISTS idx_activity_actor     ON activity_log(actor_id);
            CREATE INDEX IF NOT EXISTS idx_friendships_user   ON friendships(user_id);
        """)
