'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Clock, GraduationCap, Zap, X, Timer, Trophy, Sparkles } from 'lucide-react';
import { Habit } from '@/types';

interface Notification {
  id: string;
  type: 'exam' | 'habit' | 'motivation';
  title: string;
  message: string;
  icon: React.ReactNode;
  timer?: number; // percentage for progress bar
  timeLabel?: string;
  color: string;
}

const MOTIVATION_PHRASES = [
  "Consistency is the only path to mastery. ⚔️",
  "Don't let your streak die! 🕯️",
  "The competition is already working. Are you? 🦅",
  "Mastery isn't given, it's earned every single day. 🔥",
  "Your future self will thank you for this. ✨",
  "One more rep, one more page, one more step. 🛡️",
  "Elite operators don't wait for motivation. They execute. 🎯",
  "Small wins today lead to massive dominance tomorrow. 🌊"
];

const HABIT_REMINDERS = [
  "Time to lock in your {name}! 🔒",
  "Your {name} window is open. Execute now. ⚡",
  "Don't skip {name}. Stay on the path. 🛡️",
  "Consistency check: {name} is waiting for you. 👁️"
];

export default function NotificationManager({ habits, examGroups }: { habits: Habit[], examGroups: any[] }) {
  // Use a ref to track which notification IDs have already been sent in this session to avoid spam
  const sentNotifications = useRef<Set<string>>(new Set());

  // Fallback icon if local ones aren't available yet
  const ICON_URL = 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png';

  useEffect(() => {
    const sendSystemNotification = (id: string, title: string, body: string) => {
      if (sentNotifications.current.has(id)) return;
      
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: body,
              icon: ICON_URL,
              tag: id,
              silent: false
            });
            sentNotifications.current.add(id);
          } catch (e) {
            console.error("System notification failed:", e);
            // On some mobile devices, we need to use the service worker registration
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                  body: body,
                  icon: ICON_URL,
                  tag: id
                });
                sentNotifications.current.add(id);
              });
            }
          }
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    };

    // DEBUG: Send a "Welcome" notification to verify it works immediately if permission is granted
    if (Notification.permission === 'granted' && !sentNotifications.current.has('welcome')) {
      sendSystemNotification('welcome', 'Mastery Hub Active 🦅', 'Push architecture is now synchronized with your mobile device.');
    }

    const checkAll = () => {
      const now = new Date();
      const today = new Date();
      today.setHours(0,0,0,0);
      
      // 1. Check for Exams
      examGroups.forEach(group => {
        if (group.archived) return;
        group.subjects.forEach((subj: any) => {
          const examDate = new Date(subj.date);
          examDate.setHours(0,0,0,0);
          const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 2) {
            sendSystemNotification(`exam-2-${subj.id}`, 'Strategic Warning ⚔️', `Your ${subj.title} exam is in 48 hours. Review your syllabus now!`);
          } else if (diffDays === 1) {
            sendSystemNotification(`exam-1-${subj.id}`, 'Final Countdown 🔥', `24 hours until ${subj.title}. Stay focused, elite operator.`);
          } else if (diffDays === 0) {
            sendSystemNotification(`exam-0-${subj.id}`, 'Mastery Day 🏆', `All the best for ${subj.title}! Trust your preparation.`);
          }
        });
      });

      // 2. Check for Habits (Ignore Milestones)
      habits.forEach(habit => {
        if (habit.type === 'milestone') return;
        if (!habit.startTime) return;
        
        const [startH, startM] = habit.startTime.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(startH, startM, 0, 0);
        
        const timeDiffStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
        
        if (timeDiffStart > 0 && timeDiffStart <= 15) {
          sendSystemNotification(`habit-start-${habit.id}`, 'Mission Briefing 🎯', `${habit.name} session starts in ${Math.round(timeDiffStart)} minutes. Prepare.`);
        }
      });
      
      // 3. Random Motivation (Daily check)
      const motivationKey = `motivation-${today.toDateString()}`;
      if (!sentNotifications.current.has(motivationKey) && Math.random() > 0.95) {
        const phrase = MOTIVATION_PHRASES[Math.floor(Math.random() * MOTIVATION_PHRASES.length)];
        sendSystemNotification(motivationKey, 'Mastery Protocol 🦅', phrase);
      }
    };

    checkAll();
    const interval = setInterval(checkAll, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [habits, examGroups]);

  return null; // No in-app UI, only system push notifications
}
