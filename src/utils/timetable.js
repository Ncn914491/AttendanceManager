import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMETABLE_KEY = '@timetable';
const WEEKLY_TIMETABLE_KEY = '@weekly_timetable';

export const getTimetable = async () => {
  try {
    const timetable = await AsyncStorage.getItem(TIMETABLE_KEY);
    return timetable ? JSON.parse(timetable) : null;
  } catch (error) {
    console.error('Error getting timetable:', error);
    return null;
  }
};

export const saveTimetable = async (timetable) => {
  try {
    await AsyncStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetable));
    return true;
  } catch (error) {
    console.error('Error saving timetable:', error);
    return false;
  }
};

export const getDefaultTimetable = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const subjects = ['Mathematics', 'Computer Science'];

  // Generate a simple default timetable with only 2 subjects
  return days.flatMap((day, dayIndex) => {
    return Array(2).fill().map((_, index) => ({
      id: `${dayIndex}-${index}`,
      day,
      subject: subjects[index % subjects.length],
      startTime: `${9 + index}:00`,
      endTime: `${10 + index}:00`,
      status: null,
    }));
  });
};

// Weekly timetable functions
export const getWeeklyTimetable = async () => {
  try {
    const timetable = await AsyncStorage.getItem(WEEKLY_TIMETABLE_KEY);
    return timetable ? JSON.parse(timetable) : getDefaultWeeklyTimetable();
  } catch (error) {
    console.error('Error getting weekly timetable:', error);
    return getDefaultWeeklyTimetable();
  }
};

export const saveWeeklyTimetable = async (timetable) => {
  try {
    await AsyncStorage.setItem(WEEKLY_TIMETABLE_KEY, JSON.stringify(timetable));
    return true;
  } catch (error) {
    console.error('Error saving weekly timetable:', error);
    return false;
  }
};

export const getDefaultWeeklyTimetable = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const subjects = ['Mathematics', 'Computer Science'];

  // Create a default weekly timetable with 2 subjects per day
  const timetable = {};

  days.forEach(day => {
    timetable[day] = [];
    for (let i = 0; i < 2; i++) {
      timetable[day].push({
        id: `${day}-${i}`,
        subject: subjects[i % subjects.length],
        startTime: `${9 + i}:00`,
        endTime: `${10 + i}:00`
      });
    }
  });

  return timetable;
};
