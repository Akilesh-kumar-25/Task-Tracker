'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/db';

const ProfileDropdown = memo(function ProfileDropdown() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // The crop circle position (center x, center y) relative to the image container
  const [cropPos, setCropPos] = useState({ x: 0.5, y: 0.5 }); // 0–1 as fraction of container
  const cropRadius = 90; // px in display space — the visual circle radius
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File size exceeds 5MB.'); return; }
    setPreviewUrl(URL.createObjectURL(file));
    setCropPos({ x: 0.5, y: 0.5 }); // reset to center
  };

  // Get circle center in px from fractional position
  const getCirclePx = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { cx: 0, cy: 0, w: 0, h: 0 };
    const { width, height } = el.getBoundingClientRect();
    return { cx: cropPos.x * width, cy: cropPos.y * height, w: width, h: height };
  }, [cropPos]);

  const clampPos = (x: number, y: number, w: number, h: number) => ({
    x: Math.min(Math.max(x, cropRadius / w), 1 - cropRadius / w),
    y: Math.min(Math.max(y, cropRadius / h), 1 - cropRadius / h),
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { cx, cy } = getCirclePx();
    const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
    if (dist > cropRadius) return; // only drag if clicking inside circle
    e.preventDefault();
    dragOffsetRef.current = { dx: clickX - cx, dy: clickY - cy };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getCirclePx]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rawX = e.clientX - rect.left - dragOffsetRef.current.dx;
    const rawY = e.clientY - rect.top - dragOffsetRef.current.dy;
    const clamped = clampPos(rawX / rect.width, rawY / rect.height, rect.width, rect.height);
    setCropPos(clamped);
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  const handleSaveImage = async () => {
    if (!previewUrl || !user) return;
    setIsUploading(true);
    try {
      const el = containerRef.current!;
      const { width: displayW, height: displayH } = el.getBoundingClientRect();

      // Load the natural image to get real dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = previewUrl;
      });

      // The image is rendered with object-fit: contain inside the container
      // Calculate actual rendered image dimensions and position
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = displayW / displayH;
      let renderedW: number, renderedH: number, renderedLeft: number, renderedTop: number;
      if (imgAspect > containerAspect) {
        renderedW = displayW;
        renderedH = displayW / imgAspect;
        renderedLeft = 0;
        renderedTop = (displayH - renderedH) / 2;
      } else {
        renderedH = displayH;
        renderedW = displayH * imgAspect;
        renderedTop = 0;
        renderedLeft = (displayW - renderedW) / 2;
      }

      // Crop circle center in display px
      const cx = cropPos.x * displayW;
      const cy = cropPos.y * displayH;

      // Map to natural image coords
      const scaleX = img.naturalWidth / renderedW;
      const scaleY = img.naturalHeight / renderedH;
      const srcRadius = cropRadius * Math.min(scaleX, scaleY);
      const srcCX = (cx - renderedLeft) * scaleX;
      const srcCY = (cy - renderedTop) * scaleY;

      const outputSize = 200;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        srcCX - srcRadius, srcCY - srcRadius,
        srcRadius * 2, srcRadius * 2,
        0, 0, outputSize, outputSize
      );

      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      await updateUserProfile(user.uid, { avatar: base64 } as any);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to save picture: ' + (err as any).message);
    } finally {
      setIsUploading(false);
      setShowModal(false);
    }
  };

  const handleLogout = async () => { setIsOpen(false); await logout(); };
  const avatarSrc = profile?.avatar || user?.photoURL;

  const closeModal = () => {
    setShowModal(false);
    setPreviewUrl(null);
    setCropPos({ x: 0.5, y: 0.5 });
  };

  // Computed circle px for SVG overlay
  const circlePxStyle = (() => {
    const el = containerRef.current;
    if (!el || !previewUrl) return null;
    const { width, height } = el.getBoundingClientRect();
    return { cx: cropPos.x * width, cy: cropPos.y * height };
  })();

  const ModalContent = (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Crop Profile Picture</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {previewUrl ? 'Drag the circle to select your crop area' : 'Choose a photo to get started'}
          </p>
        </div>

        {/* Image + Crop Circle area */}
        <div className="px-8 py-6">
          <div
            ref={containerRef}
            className="relative w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 select-none"
            style={{ height: 320, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {previewUrl ? (
              <>
                {/* Full image - always visible */}
                <img
                  src={previewUrl}
                  alt="Full preview"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none"
                  style={{ userSelect: 'none' }}
                />

                {/* SVG overlay: dim outside circle, bright inside */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ top: 0, left: 0 }}
                >
                  <defs>
                    <mask id="cropMask">
                      <rect width="100%" height="100%" fill="white" />
                      <circle
                        cx={`${cropPos.x * 100}%`}
                        cy={`${cropPos.y * 100}%`}
                        r={cropRadius}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  {/* Dimmed overlay outside the circle */}
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.55)"
                    mask="url(#cropMask)"
                  />
                  {/* Circle border */}
                  <circle
                    cx={`${cropPos.x * 100}%`}
                    cy={`${cropPos.y * 100}%`}
                    r={cropRadius}
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeDasharray="8 4"
                    opacity="0.9"
                  />
                  {/* Grab handle hint crosshair */}
                  <line
                    x1={`${cropPos.x * 100}%`}
                    y1={`calc(${cropPos.y * 100}% - 12px)`}
                    x2={`${cropPos.x * 100}%`}
                    y2={`calc(${cropPos.y * 100}% + 12px)`}
                    stroke="white"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                  <line
                    x1={`calc(${cropPos.x * 100}% - 12px)`}
                    y1={`${cropPos.y * 100}%`}
                    x2={`calc(${cropPos.x * 100}% + 12px)`}
                    y2={`${cropPos.y * 100}%`}
                    stroke="white"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                </svg>

                {/* Instruction badge */}
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                  Drag circle to crop
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-black uppercase tracking-widest opacity-50">No photo selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <label className="flex-1 cursor-pointer flex items-center justify-center py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#5c544d] transition-colors border-2 border-slate-100 dark:border-slate-800 hover:border-[#5c544d]/30 text-center">
            {previewUrl ? 'New Photo' : 'Choose Photo'}
            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/jpeg,image/jpg,image/png,image/webp" />
          </label>
          <button
            onClick={closeModal}
            className="flex-1 py-3.5 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors border-2 border-slate-100 dark:border-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveImage}
            disabled={!previewUrl || isUploading}
            className="flex-[2] py-3.5 bg-[#5c544d] rounded-2xl text-xs font-black text-white hover:bg-[#4a433d] disabled:opacity-40 transition-all shadow-xl uppercase tracking-widest"
          >
            {isUploading ? 'Saving...' : 'Change'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
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
              className="flex items-center w-full px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-[#5c544d]/10 hover:text-[#5c544d] rounded-xl transition-all"
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
