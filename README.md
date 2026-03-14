# Mobile Chat App (Laravel + React Native)

A full-stack mobile chat application featuring a Laravel API backend and a React Native TypeScript frontend.

## Project Structure

- **/backend**: Laravel API (PHP)
- **/mobile**: React Native App (TypeScript)

---

## Getting Started

### 1. Backend Setup (Laravel)

1. Navigate to the folder: `cd backend`
2. Install dependencies: `composer install && npm install`
3. Copy environment file: `cp .env.example .env`
4. Generate app key: `php artisan key:generate`
5. Run migrations: `php artisan migrate`
6. Start the server: `php artisan serve`

### 2. Mobile Setup (React Native)

1. Navigate to the folder: `cd mobile`
2. Install dependencies: `npm install` (or `yarn install`)
3. **iOS Only:** `cd ios && pod install && cd ..`
4. Start the bundler: `npx react-native start`
5. Run on device/emulator:
   - Android: `npx react-native run-android`
   - iOS: `npx react-native run-ios`

---

## Tech Stack

- **Backend:** Laravel 12, MySQL, Reverb/WebSockets (for chat)
- **Frontend:** React Native, TypeScript, Axios
