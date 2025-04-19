import * as SQLite from 'expo-sqlite';

let db = null;

const getDatabase = async () => {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync('attendance.db');
      console.log('SQLite database opened successfully');
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return db;
};

export const initDatabase = async () => {
  try {
    const db = await getDatabase();
    console.log('Initializing database...');

    // Use execAsync for multiple SQL statements
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- Drop the existing table if it exists
      DROP TABLE IF EXISTS attendance;

      -- Create a new table with subject as optional
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT DEFAULT 'Unknown',
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        multiplier INTEGER DEFAULT 1,
        is_manual BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS exam_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        marks REAL NOT NULL,
        total_marks REAL NOT NULL,
        weightage REAL DEFAULT 1,
        exam_date TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        description TEXT
      );
    `);

    console.log('Database initialized successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Test function to verify database setup
export const testDatabase = async () => {
  try {
    const database = await getDatabase();
    console.log('Testing database connection...');

    // Insert a test record
    const today = new Date().toISOString().split('T')[0];
    await database.runAsync(
      'INSERT INTO attendance (subject, date, status, notes) VALUES (?, ?, ?, ?);',
      'Test Subject', today, 'test', 'Test record'
    );
    console.log('Test record inserted successfully');

    // Clean up test record
    await database.runAsync(
      'DELETE FROM attendance WHERE notes = ?;',
      'Test record'
    );
    console.log('Test record cleaned up');

    return Promise.resolve();
  } catch (error) {
    console.error('Error testing database:', error);
    throw error;
  }
};

export const addAttendance = async (date, status, notes = '', multiplier = 1, isManual = false) => {
  try {
    const database = await getDatabase();

    // Extract subject from notes if it's in the format "Class: Subject"
    let subject = 'Unknown';
    if (notes && notes.includes(': ')) {
      const parts = notes.split(': ');
      if (parts.length >= 2) {
        subject = parts[1];
      }
    }

    const result = await database.runAsync(
      'INSERT INTO attendance (subject, date, status, notes, multiplier, is_manual) VALUES (?, ?, ?, ?, ?, ?);',
      subject, date, status, notes, multiplier, isManual ? 1 : 0
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding attendance:', error);
    throw error;
  }
};

// Add attendance directly for a subject
export const addSubjectAttendance = async (subject, date, status, multiplier = 1) => {
  try {
    const database = await getDatabase();
    const notes = `Subject: ${subject}`;
    const result = await database.runAsync(
      'INSERT INTO attendance (subject, date, status, notes, multiplier, is_manual) VALUES (?, ?, ?, ?, ?, ?);',
      subject, date, status, notes, multiplier, 1
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding subject attendance:', error);
    throw error;
  }
};

export const updateAttendance = async (id, status, multiplier = 1) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE attendance SET status = ?, multiplier = ?, is_manual = 1 WHERE id = ?;',
      status, multiplier, id
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

export const getAttendance = async (date) => {
  try {
    const database = await getDatabase();
    return await database.getFirstAsync('SELECT * FROM attendance WHERE date = ?;', date);
  } catch (error) {
    console.error('Error getting attendance:', error);
    throw error;
  }
};

export const getAllAttendance = async () => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM attendance WHERE is_archived = 0 ORDER BY date DESC;');
  } catch (error) {
    console.error('Error getting all attendance:', error);
    throw error;
  }
};

export const getArchivedAttendance = async () => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM attendance WHERE is_archived = 1 ORDER BY date DESC;');
  } catch (error) {
    console.error('Error getting archived attendance:', error);
    throw error;
  }
};

export const archiveAttendance = async (id) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE attendance SET is_archived = 1 WHERE id = ?;',
      id
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error archiving attendance:', error);
    throw error;
  }
};

export const restoreAttendance = async (id) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE attendance SET is_archived = 0 WHERE id = ?;',
      id
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error restoring attendance:', error);
    throw error;
  }
};

export const getAttendanceBySubject = async (subject) => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM attendance WHERE notes LIKE ? AND is_archived = 0 ORDER BY date DESC;',
      `%${subject}%`
    );
  } catch (error) {
    console.error('Error getting attendance by subject:', error);
    throw error;
  }
};

export const archiveAttendanceBySubject = async (subject) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE attendance SET is_archived = 1 WHERE subject = ?;',
      subject
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error archiving attendance by subject:', error);
    throw error;
  }
};

export const getAttendanceByDate = async (date) => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM attendance WHERE date = ? AND is_archived = 0 ORDER BY id DESC;',
      date
    );
  } catch (error) {
    console.error('Error getting attendance by date:', error);
    throw error;
  }
};

export const getAttendanceByDateRange = async (startDate, endDate) => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM attendance WHERE date BETWEEN ? AND ? AND is_archived = 0 ORDER BY date DESC;',
      startDate, endDate
    );
  } catch (error) {
    console.error('Error getting attendance by date range:', error);
    throw error;
  }
};

export const archiveAttendanceByDateRange = async (startDate, endDate) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE attendance SET is_archived = 1 WHERE date BETWEEN ? AND ?;',
      startDate, endDate
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error archiving attendance by date range:', error);
    throw error;
  }
};

export const deleteAttendance = async (id) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync('DELETE FROM attendance WHERE id = ?;', id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    throw error;
  }
};

export const addExamMark = async (subject, marks, totalMarks, weightage, examDate, notes = '') => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'INSERT INTO exam_marks (subject, marks, total_marks, weightage, exam_date, notes) VALUES (?, ?, ?, ?, ?, ?);',
      subject, marks, totalMarks, weightage, examDate, notes
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding exam mark:', error);
    throw error;
  }
};

export const updateExamMark = async (id, marks, totalMarks, weightage, notes = '') => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync(
      'UPDATE exam_marks SET marks = ?, total_marks = ?, weightage = ?, notes = ? WHERE id = ?;',
      marks, totalMarks, weightage, notes, id
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating exam mark:', error);
    throw error;
  }
};

export const deleteExamMark = async (id) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync('DELETE FROM exam_marks WHERE id = ?;', id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting exam mark:', error);
    throw error;
  }
};

export const getAllExamMarks = async () => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM exam_marks ORDER BY exam_date DESC;');
  } catch (error) {
    console.error('Error getting all exam marks:', error);
    throw error;
  }
};

export const getExamMarksBySubject = async (subject) => {
  try {
    const database = await getDatabase();
    return await database.getAllAsync(
      'SELECT * FROM exam_marks WHERE subject = ? ORDER BY exam_date DESC;',
      subject
    );
  } catch (error) {
    console.error('Error getting exam marks by subject:', error);
    throw error;
  }
};

// Get all unique subjects from the database
export const getAllSubjects = async () => {
  try {
    const database = await getDatabase();

    // Get subjects from attendance records
    const attendanceSubjects = await database.getAllAsync(
      'SELECT DISTINCT subject FROM attendance WHERE subject IS NOT NULL AND subject != "Unknown";'
    );

    // Get subjects from exam marks
    const examSubjects = await database.getAllAsync(
      'SELECT DISTINCT subject FROM exam_marks WHERE subject IS NOT NULL;'
    );

    // Combine and deduplicate subjects
    const subjects = new Set();

    attendanceSubjects.forEach(record => {
      if (record.subject) subjects.add(record.subject);
    });

    examSubjects.forEach(record => {
      if (record.subject) subjects.add(record.subject);
    });

    return Array.from(subjects).sort();
  } catch (error) {
    console.error('Error getting all subjects:', error);
    throw error;
  }
};

export default getDatabase;
