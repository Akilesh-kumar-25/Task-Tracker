# 🎯 HabitTracker - Professional Habit Tracking System

HabitTracker is a premium, high-performance web application designed to help users build and maintain consistent daily routines. Featuring a cinematic dashboard, secure authentication, and advanced progress analytics.

## ✨ Key Features

- **365-Day Goal System**: Track your progress against an annual target. Every day you tick at least one box counts towards your 365-day goal.
- **Cinematic Dashboard**: A professional, responsive UI with real-time progress charts and weekly analysis.
- **Secure Authentication**: Robust login system with password complexity enforcement and persistent sessions.
- **Cloud-Synced Profiles**: Upload and manage your profile picture securely (stored in Firestore to bypass size limits).
- **Responsive Design**: Works perfectly on desktop and mobile devices.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication & Firestore)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Akilesh-kumar-25/Task-Tracker.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Usage

- **Add Habits**: Click the "+" button in the grid to create new habits with custom emojis.
- **Track Progress**: Click the circles in the daily grid to mark tasks as complete.
- **Update Profile**: Click your profile icon in the top right to upload a new picture (< 200KB).

---
*Built with ❤️ by Akilesh Kumar*
