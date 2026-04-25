'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, emoji: string) => Promise<void>;
}

const EMOJI_SUGGESTIONS = [
  '🎯', '💪', '📚', '🧘', '🏃', '💧', '😴', '🧠',
  '💻', '🎨', '🎵', '🚴', '🏊', '🧺', '📊', '🍎',
  '🚶', '⛹️', '🤸', '🏋️', '📝', '💌', '🎬', '📸',
  '🌱', '🍳', '🧋', '🥗', '🚗', '✈️', '🎭', '🎮',
];

export default function AddHabitModal({
  isOpen,
  onClose,
  onAdd,
}: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onAdd(name, selectedEmoji);
      setName('');
      setSelectedEmoji('🎯');
      onClose();
    } catch (error) {
      console.error('Failed to add habit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add New Habit
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Habit Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Exercise"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Select Emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`rounded-lg p-2 text-xl transition ${
                    selectedEmoji === emoji
                      ? 'bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Preview:</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {selectedEmoji} {name || 'Habit name'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 p-6 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {loading ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
