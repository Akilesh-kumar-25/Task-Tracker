'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/db';

const ProfileDropdown = memo(function ProfileDropdown() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 200 * 1024) {
      alert('File size exceeds 200KB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSaveImage = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const compressedBase64 = await resizeImage(selectedFile);
      // Removed updateProfile(user, { photoURL: ... }) because it has a small size limit and causes failures.
      // We store the avatar in Firestore instead.
      await updateUserProfile(user.uid, { avatar: compressedBase64 } as any);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to upload picture. Error: ' + (err as any).message);
    } finally {
      setIsUploading(false);
      setShowModal(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  // Avatar source priority: Firestore Profile > Firebase Auth > Fallback Initials
  const avatarSrc = profile?.avatar || user?.photoURL;

  const ModalContent = (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Upload Profile Picture</h2>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 mb-6 uppercase tracking-widest">Max size: 200KB</p>
        
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            )}
          </div>
          
          <label className="cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-6 py-2.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Choose File
            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/jpeg,image/jpg,image/png" />
          </label>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => { setShowModal(false); setSelectedFile(null); setPreviewUrl(null); }}
            className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Edit
          </button>
          <button 
            onClick={handleSaveImage}
            disabled={!selectedFile || isUploading}
            className="flex-1 py-3 bg-indigo-600 rounded-2xl text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none uppercase tracking-widest"
          >
            {isUploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Upload Modal rendered via Portal to Body to escape all parent containers */}
      {showModal && mounted && createPortal(ModalContent, document.body)}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-xs overflow-hidden border-2 border-white dark:border-slate-800 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all ${isUploading ? 'opacity-50 animate-pulse' : ''}`}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          user?.displayName?.charAt(0).toUpperCase() || 'U'
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.displayName || 'User Account'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => { setShowModal(true); setIsOpen(false); }}
              className="flex items-center w-full px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
            >
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
              Update Picture
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all mt-1"
            >
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileDropdown;
