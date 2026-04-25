import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserPreferences } from '@/types';

// Get or create user in Firestore
export async function ensureUserExists(firebaseUser: FirebaseUser, manualName?: string): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // First time login - create user document
    const defaultPreferences: UserPreferences = {
      theme: 'auto',
      fiscalYearStart: 4, // April
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      accentColor: '#10B981', // Emerald
    };

    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: manualName || firebaseUser.displayName || 'User',
      avatar: firebaseUser.photoURL,
      createdAt: serverTimestamp(),
      preferences: defaultPreferences,
    });
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    preferences,
    updatedAt: serverTimestamp(),
  });
}

// Delete user data (when deleting account)
export async function deleteUserData(userId: string): Promise<void> {
  // This should be called from Cloud Function for security
  // For now, just placeholder
  console.log('Delete user:', userId);
}
