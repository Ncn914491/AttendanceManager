// Import using the latest API approach for expo-sqlite
import { openDatabase } from 'expo-sqlite';

let db = null;

const getDatabase = () => {
  if (!db) {
    try {
      // Using the correct API for Expo SDK 52
      db = openDatabase('attendance.db');
      console.log('SQLite database opened successfully');
    } catch (error) {
      console.error('Error opening database:', error);
      throw error;
    }
  }
  return db;
};

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      console.log('Initializing database...');
      
      database.transaction(tx => {
        // Create attendance table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            multiplier INTEGER DEFAULT 1,
            is_manual INTEGER DEFAULT 0
          );`
        );

        // Create exam_marks table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS exam_marks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            marks REAL NOT NULL,
            total_marks REAL NOT NULL,
            weightage REAL NOT NULL,
            exam_date TEXT NOT NULL,
            notes TEXT
          );`
        );

        // Create holidays table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS holidays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            note TEXT
          );`
        );
      }, 
      error => {
        console.error('Error creating tables:', error);
        reject(error);
      },
      () => {
        console.log('Database tables created successfully');
        resolve();
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      reject(error);
    }
  });
};

// Test function to verify database setup
export const testDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      console.log('Testing database connection...');
      
      database.transaction(tx => {
        // Try to insert a test record
        tx.executeSql(
          'INSERT INTO attendance (date, status, notes) VALUES (?, ?, ?);',
          [new Date().toISOString().split('T')[0], 'test', 'Test record'],
          (_, result) => {
            console.log('Test record inserted successfully');
            // Clean up test record
            tx.executeSql(
              'DELETE FROM attendance WHERE notes = ?;',
              ['Test record'],
              () => {
                console.log('Test record cleaned up');
                resolve();
              },
              (_, error) => {
                console.error('Error cleaning up test record:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error inserting test record:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Error testing database:', error);
      reject(error);
    }
  });
};

export const addAttendance = (date, status, notes = '', multiplier = 1, isManual = false) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'INSERT INTO attendance (date, status, notes, multiplier, is_manual) VALUES (?, ?, ?, ?, ?);',
        [date, status, notes, multiplier, isManual ? 1 : 0],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const updateAttendance = (id, status, multiplier = 1) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'UPDATE attendance SET status = ?, multiplier = ?, is_manual = 1 WHERE id = ?;',
        [status, multiplier, id],
        (_, result) => {
          resolve(result.rowsAffected > 0);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAttendance = (date) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM attendance WHERE date = ?;',
        [date],
        (_, { rows: { _array } }) => {
          resolve(_array[0]);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAllAttendance = () => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM attendance ORDER BY date DESC;',
        [],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAttendanceBySubject = (subject) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM attendance WHERE notes LIKE ? ORDER BY date DESC;',
        [`%${subject}%`],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAttendanceByDate = (date) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM attendance WHERE date = ? ORDER BY id DESC;',
        [date],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAttendanceByDateRange = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM attendance WHERE date BETWEEN ? AND ? ORDER BY date DESC;',
        [startDate, endDate],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const deleteAttendance = (id) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM attendance WHERE id = ?;',
        [id],
        (_, result) => {
          resolve(result.rowsAffected > 0);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const addExamMark = (subject, marks, totalMarks, weightage, examDate, notes = '') => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'INSERT INTO exam_marks (subject, marks, total_marks, weightage, exam_date, notes) VALUES (?, ?, ?, ?, ?, ?);',
        [subject, marks, totalMarks, weightage, examDate, notes],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const updateExamMark = (id, marks, totalMarks, weightage, notes = '') => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'UPDATE exam_marks SET marks = ?, total_marks = ?, weightage = ?, notes = ? WHERE id = ?;',
        [marks, totalMarks, weightage, notes, id],
        (_, result) => {
          resolve(result.rowsAffected > 0);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const deleteExamMark = (id) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM exam_marks WHERE id = ?;',
        [id],
        (_, result) => {
          resolve(result.rowsAffected > 0);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getAllExamMarks = () => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM exam_marks ORDER BY exam_date DESC;',
        [],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getExamMarksBySubject = (subject) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM exam_marks WHERE subject = ? ORDER BY exam_date DESC;',
        [subject],
        (_, { rows: { _array } }) => {
          resolve(_array);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export default getDatabase;
