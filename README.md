# Attendance Manager App

## 📌 Overview
The **Attendance Manager** is a simple and efficient app that helps students track their attendance. Users can input their timetable, mark attendance, view statistics, manage assignments, and store notes. The app is designed to work **entirely offline** with local data storage.

## 🎯 Features
- **Mark Attendance:** Present, Absent, or Class Canceled.
- **Timetable Management:** Input subjects and display daily schedules.
- **Extra Classes:** Add special classes separately.
- **Attendance Statistics:** View attendance in numbers and percentages.
- **Multiplier Option:** For periods counted as two.
- **To-Do List:** Track assignments and pending tasks.
- **Notes Section:** Store important topics and references.
- **Exam Marks Storage:** Keep track of exam scores and weightage.
- **Attendance Safety Check:** Shows classes that can be skipped while staying above the required attendance.
- **Calendar View:** Track past attendance and holidays.
- **Offline Functionality:** No cloud services, all data is stored locally.

## 🚀 Installation
### Prerequisites
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)
- [Expo](https://expo.dev/) for React Native development
- Android Emulator or Physical Device

### Steps
```sh
# Clone the repository
git clone https://github.com/your-username/attendance-manager.git
cd attendance-manager

# Install dependencies
npm install

# Start the app
npx expo start
```

## 🛠 Troubleshooting & Common Errors
### 1. **Module Not Found Error**
**Solution:** Run `npm install` to ensure all dependencies are installed.

### 2. **Metro Bundler Not Starting**
**Solution:** Try clearing the cache and restarting Expo:
```sh
npx expo start -c
```

### 3. **App Not Running on Emulator**
**Solution:** Ensure your emulator is running before starting Expo, or try using a physical device with the Expo Go app.

### 4. **Data Not Persisting**
**Solution:** Verify that AsyncStorage or SQLite is properly configured.

### 5. **Expo Build Errors**
**Solution:** Check for outdated dependencies with:
```sh
npm outdated
```
Then update dependencies selectively with `npm update <package-name>`.

## 🏗 Future Updates
- Cloud Backup & Sync (Optional)
- Dark Mode
- Improved UI & Themes
- Advanced Analytics for Attendance Trends

## 💬 Contributions & Issues
Feel free to report issues or contribute by submitting a pull request.




