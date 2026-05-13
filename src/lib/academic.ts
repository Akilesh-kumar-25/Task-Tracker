import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function getUserTodos(userId: string) {
  const todosRef = collection(db, 'users', userId, 'todos');
  const q = query(todosRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveTodo(userId: string, todo: any) {
  const todoRef = doc(db, 'users', userId, 'todos', todo.id);
  await setDoc(todoRef, { ...todo, lastUpdated: serverTimestamp() }, { merge: true });
}

export async function deleteTodo(userId: string, todoId: string) {
  const todoRef = doc(db, 'users', userId, 'todos', todoId);
  await deleteDoc(todoRef);
}

export async function getUserExamGroups(userId: string) {
  const groupsRef = collection(db, 'users', userId, 'examGroups');
  const snapshot = await getDocs(groupsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveExamGroup(userId: string, group: any) {
  const groupRef = doc(db, 'users', userId, 'examGroups', group.id);
  await setDoc(groupRef, { ...group, lastUpdated: serverTimestamp() }, { merge: true });
}

export async function deleteExamGroup(userId: string, groupId: string) {
  const groupRef = doc(db, 'users', userId, 'examGroups', groupId);
  await deleteDoc(groupRef);
}
