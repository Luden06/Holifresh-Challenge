import Database from "better-sqlite3";
import path from "path";

// Support both development and production paths
const dbPath = path.resolve(process.cwd(), "dev.db");

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize schema if not exists
db.exec(`
    CREATE TABLE IF NOT EXISTS Room (
        id String PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        joinCode TEXT NOT NULL,
        objectiveTotal INTEGER DEFAULT 0,
        rdvValueCents INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        openedAt DATETIME,
        closedAt DATETIME,
        signaturesGoal INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Participant (
        id TEXT PRIMARY KEY,
        roomId TEXT NOT NULL,
        displayName TEXT NOT NULL,
        displayNameKey TEXT NOT NULL,
        tokenHash TEXT UNIQUE NOT NULL,
        lastClaimAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (roomId) REFERENCES Room(id) ON DELETE CASCADE,
        UNIQUE(roomId, displayNameKey)
    );

    CREATE TABLE IF NOT EXISTS Claim (
        id TEXT PRIMARY KEY,
        roomId TEXT NOT NULL,
        participantId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        clientRequestId TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'VALID',
        cancelledAt DATETIME,
        cancelledBy TEXT,
        cancelReason TEXT,
        FOREIGN KEY (roomId) REFERENCES Room(id) ON DELETE CASCADE,
        FOREIGN KEY (participantId) REFERENCES Participant(id) ON DELETE CASCADE
    );
`);

// Migration: Add signaturesGoal if it doesn't exist
try {
    db.exec("ALTER TABLE Room ADD COLUMN signaturesGoal INTEGER DEFAULT 0");
} catch (e) {
    // Column likely already exists
}

export default db;
