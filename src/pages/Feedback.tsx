import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import type { Feedback as FeedbackType } from '../types';
import { MessageSquare, Send, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

export function Feedback() {
  const { feedbacks, addFeedback, currentUserId, members, currentUserRole, activeGroupId } = useAppContext();
  const [type, setType] = useState<'Bug' | 'Feature Request' | 'Other'>('Feature Request');
  const [text, setText] = useState('');
  
  const currentMember = members.find(m => m.id === currentUserId);
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    addFeedback({
      id: generateId(),
      userId: currentUserId || 'Unknown',
      groupId: activeGroupId || 'GLOBAL',
      date: new Date().toISOString(),
      type,
      text,
      status: 'Open'
    });

    setText('');
    alert('Thank you for your feedback!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          Feedback & Suggestions
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Submit Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bento-input"
            >
              <option value="Feature Request">Feature Request</option>
              <option value="Bug">Report a Bug</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Details</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bento-input min-h-[120px] resize-y"
              placeholder="Tell us what you'd like to see or what's not working..."
              required
            />
          </div>
          
          <button
            type="submit"
            className="bento-btn bento-btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Feedback
          </button>
        </form>
      </div>

      {isAdmin && feedbacks.length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Feedback (Admin View)</h2>
          <div className="grid gap-4">
            {feedbacks.slice().reverse().map(fb => {
              const author = members.find(m => m.id === fb.userId);
              return (
                <div key={fb.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 items-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        fb.type === 'Bug' ? 'bg-red-100 text-red-700' :
                        fb.type === 'Feature Request' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {fb.type}
                      </span>
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(fb.date), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-800 text-sm mb-4 whitespace-pre-wrap">{fb.text}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <User className="w-4 h-4" />
                    {author?.name || 'Unknown User'} ({author?.contact || 'N/A'})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
