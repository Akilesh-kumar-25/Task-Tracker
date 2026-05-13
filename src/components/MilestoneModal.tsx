import React, { useState } from 'react';
import { X, CheckCircle2, Flag, ArrowRight, Target, Sparkles } from 'lucide-react';
import { Habit } from '@/types';

interface MilestoneModalProps {
  milestone: Habit;
  onClose: () => void;
  onUpdate: (checklistItems: string[], milestoneCompletions: string[]) => void;
}

export default function MilestoneModal({ milestone, onClose, onUpdate }: MilestoneModalProps) {
  const [steps, setSteps] = useState<string[]>(milestone.checklistItems || []);
  const [completions, setCompletions] = useState<string[]>(milestone.milestoneCompletions || []);
  const [newStep, setNewStep] = useState('');

  const completedCount = completions.length;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddStep = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newStep.trim()) {
      setSteps([...steps, newStep.trim()]);
      setNewStep('');
    }
  };

  const toggleStep = (step: string) => {
    if (completions.includes(step)) {
      setCompletions(completions.filter(s => s !== step));
    } else {
      setCompletions([...completions, step]);
    }
  };

  const removeStep = (stepToRemove: string) => {
    setSteps(steps.filter(s => s !== stepToRemove));
    setCompletions(completions.filter(s => s !== stepToRemove));
  };

  const handleSave = () => {
    onUpdate(steps, completions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500 px-4">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-[40px] bg-[#fcfaf9] dark:bg-[#2d241e] p-10 shadow-2xl border border-[#5c544d]/10 dark:border-white/10 flex flex-col relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#8b7f74]/20 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#8b7f74]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div className="flex gap-5 items-center">
            <div className="w-20 h-20 bg-[#5c544d]/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-[#5c544d]/10 backdrop-blur-md">
              {milestone.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#8b7f74] mb-1">
                <Target size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Active Project</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading italic text-[#5c544d] dark:text-white tracking-tight">{milestone.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all text-[#5c544d] dark:text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Progress Display */}
        <div className="relative z-10 bg-[#5c544d]/5 dark:bg-black/40 border border-[#5c544d]/10 dark:border-white/5 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-inner">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-[#8b7f74] dark:text-gray-300">Project Completion</span>
              <span className="text-3xl font-black text-[#5c544d] dark:text-[#d4b483] font-heading italic">{progressPct}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#5c544d] to-[#8b7f74] transition-all duration-1000 ease-out relative"
                style={{ width: `${progressPct}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 blur-[2px] animate-pulse" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 px-6 py-4 rounded-2xl border border-[#5c544d]/10 dark:border-white/10 text-center min-w-[140px] shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#8b7f74] dark:text-gray-400 mb-1">Steps Completed</p>
            <p className="text-2xl font-bold text-[#5c544d] dark:text-white"><span className="text-[#8b7f74] dark:text-[#d4b483]">{completedCount}</span> / {totalCount}</p>
          </div>
        </div>

        {/* Add Step Input - MOVED TO TOP */}
        <div className="relative z-10 mb-6 flex gap-3 p-1">
          <input 
            type="text" 
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={handleAddStep}
            placeholder="What's the next step? Type & press Enter..." 
            className="flex-1 bg-white dark:bg-black/40 border border-[#5c544d]/10 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-[#5c544d] dark:text-white outline-none focus:border-[#5c544d] transition-all"
          />
          <button 
            onClick={() => handleAddStep({ key: 'Enter' } as any)}
            className="px-6 bg-[#5c544d] text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-[#4a443e] transition-all shadow-lg shadow-[#5c544d]/20"
          >
            Add <ArrowRight size={16} />
          </button>
        </div>

        {/* Steps List */}
        <div className="relative z-10 flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] mb-4 pl-2">Journey Steps</h3>
          
          {steps.map((step, i) => {
            const isCompleted = completions.includes(step);
            return (
              <div 
                key={i} 
                onClick={() => toggleStep(step)}
                className={`group flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isCompleted ? 'bg-[#5c544d]/5 border-[#5c544d]/30' : 'bg-white dark:bg-white/5 border-[#5c544d]/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-[#5c544d]/20'}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-[#5c544d] text-white scale-110' : 'border-2 border-gray-300 dark:border-gray-600 group-hover:border-[#5c544d]'}`}>
                    {isCompleted && <CheckCircle2 size={16} />}
                  </div>
                  <span className={`text-base font-bold transition-all duration-300 ${isCompleted ? 'text-[#5c544d] dark:text-[#d4b483] line-through opacity-80' : 'text-[#5c544d] dark:text-gray-200'}`}>
                    {step}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeStep(step); }} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
          
          {steps.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center opacity-50">
              <Flag size={48} className="text-[#8b7f74] mb-4" />
              <p className="text-sm font-bold text-[#8b7f74]">No steps added yet. Plan your milestone above.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-8 pt-6 border-t border-[#5c544d]/10 dark:border-white/10 flex justify-between items-center">
          <p className="text-xs font-medium text-[#8b7f74]">All progress is tracked globally across this milestone.</p>
          <button onClick={handleSave} className="px-8 py-4 rounded-2xl bg-[#5c544d] text-white text-sm font-black uppercase tracking-widest hover:scale-105 shadow-lg transition-all flex items-center gap-2">
            <Sparkles size={16} /> Save Progress
          </button>
        </div>
      </div>
    </div>
  );
}
