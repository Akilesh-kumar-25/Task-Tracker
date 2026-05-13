import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlignLeft, Layout } from 'lucide-react';
import { Habit, HabitEntry } from '@/types';

interface TaskDetailModalProps {
  habit: Habit;
  dateStr: string; // The specific date being viewed
  entry: HabitEntry | null;
  onClose: () => void;
  onUpdateMode: (mode: 'checklist' | 'notes' | 'hybrid') => void;
  onUpdateChecklistItems: (items: string[]) => void;
  onUpdateEntry: (checklistCompletions: Record<string, boolean>, note: string) => void;
}

export default function TaskDetailModal({
  habit,
  dateStr,
  entry,
  onClose,
  onUpdateMode,
  onUpdateChecklistItems,
  onUpdateEntry,
}: TaskDetailModalProps) {
  const [mode, setMode] = useState<'checklist' | 'notes' | 'hybrid'>(habit.mode === 'default' ? 'hybrid' : (habit.mode || 'hybrid'));
  const [checklistItems, setChecklistItems] = useState<string[]>(habit.checklistItems || []);
  const [newItemText, setNewItemText] = useState('');
  
  // Local state for the entry data
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (entry && entry.checklistCompletions && entry.checklistCompletions[habit.id]) {
      setCompletions(entry.checklistCompletions[habit.id]);
    } else {
      setCompletions({});
    }
    
    if (entry && entry.notes && entry.notes[habit.id]) {
      setNote(entry.notes[habit.id]);
    } else {
      setNote('');
    }
  }, [entry, habit.id]);

  const handleSave = () => {
    if (mode !== habit.mode) onUpdateMode(mode);
    onUpdateChecklistItems(checklistItems);
    onUpdateEntry(completions, note);
    onClose();
  };

  const handleAddItem = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemText.trim()) {
      setChecklistItems([...checklistItems, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const toggleItem = (item: string) => {
    setCompletions(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const removeItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-800 border border-white/20 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white flex items-center gap-2">
              <span className="text-3xl">{habit.emoji}</span> {habit.name}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] mt-1">
              Task Deep-Dive • {dateStr}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:scale-110 transition-transform">
            <X size={20} className="text-[#5c544d] dark:text-slate-300" />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setMode('hybrid')} className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${mode === 'hybrid' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}><Layout size={14}/> Hybrid</button>
          <button onClick={() => setMode('checklist')} className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${mode === 'checklist' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}><CheckSquare size={14}/> Checklist</button>
          <button onClick={() => setMode('notes')} className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${mode === 'notes' ? 'bg-[#5c544d] text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}><AlignLeft size={14}/> Notes</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 min-h-[300px]">
          {(mode === 'checklist' || mode === 'hybrid') && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#8b7f74]">Checklist Items</h3>
              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 group">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={!!completions[item]} 
                        onChange={() => toggleItem(item)}
                        className="w-4 h-4 rounded text-[#5c544d] focus:ring-[#5c544d]"
                      />
                      <span className={`text-sm font-bold ${completions[item] ? 'line-through text-gray-400' : 'text-[#5c544d] dark:text-slate-200'}`}>{item}</span>
                    </label>
                    <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-all"><X size={14}/></button>
                  </div>
                ))}
                <input 
                  type="text" 
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleAddItem}
                  placeholder="Type new item & press Enter..." 
                  className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-[#5c544d] transition-colors"
                />
              </div>
            </div>
          )}

          {(mode === 'notes' || mode === 'hybrid') && (
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#8b7f74]">Study / Progress Notes</h3>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log your learning modules, specific topics covered, or progress details here..."
                className="w-full flex-1 min-h-[150px] p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#5c544d]/20 resize-none"
              />
            </div>
          )}
          

        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-[#5c544d] text-white text-sm font-bold hover:scale-105 shadow-lg transition-all">Save Tracking Data</button>
        </div>
      </div>
    </div>
  );
}
