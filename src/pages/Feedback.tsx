import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import type { Feedback as FeedbackType } from '../types';
import { MessageSquare, Send, Calendar, User, Tag, Pencil, Trash2, Star, Reply } from 'lucide-react';
import { format } from 'date-fns';

export function Feedback() {
  const { feedbacks, addFeedback, updateFeedback, deleteFeedback, currentUserId, members, currentUserRole, activeGroupId } = useAppContext();
  const [type, setType] = useState<'Bug' | 'Feature Request' | 'App Review' | 'Other'>('Feature Request');
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number>(5);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'Bug' | 'Feature Request' | 'App Review' | 'Other'>('Feature Request');
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState<number>(5);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const currentMember = members.find(m => m.id === currentUserId);
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

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
      status: 'Open',
      ...(type === 'App Review' ? { rating } : {})
    });

    setText('');
    setType('Feature Request');
    setRating(5);
    alert('Thank you for your feedback!');
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) return;
    const fb = feedbacks.find(f => f.id === id);
    if (!fb) return;
    
    updateFeedback({
      ...fb,
      type: editType,
      text: editText,
      ...(editType === 'App Review' ? { rating: editRating } : { rating: undefined })
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this?')) {
      deleteFeedback(id);
    }
  };

  const handleReply = (id: string) => {
    const fb = feedbacks.find(f => f.id === id);
    if (!fb) return;
    updateFeedback({ ...fb, reply: replyText });
    setReplyingId(null);
    setReplyText('');
  };

  const groupFeedbacks = feedbacks.filter(f => f.groupId === activeGroupId || f.groupId === 'GLOBAL');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          Feedback & Reviews
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
              <option value="App Review">App Review</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {type === 'App Review' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                   <button 
                     key={star} 
                     type="button" 
                     onClick={() => setRating(star)}
                     className="focus:outline-none"
                   >
                     <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                   </button>
                ))}
              </div>
            </div>
          )}

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
            Submit
          </button>
        </form>
      </div>

      {groupFeedbacks.length > 0 && (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Submissions</h2>
          <div className="grid gap-4">
            {groupFeedbacks.slice().reverse().map(fb => {
              const author = members.find(m => m.id === fb.userId);
              const isOwner = currentUserId === fb.userId;
              const canEditDelete = isOwner || currentUserRole === 'SUPER_ADMIN';

              if (editingId === fb.id) {
                return (
                  <div key={fb.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <select value={editType} onChange={e => setEditType(e.target.value as any)} className="w-full bento-input">
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug">Report a Bug</option>
                      <option value="App Review">App Review</option>
                      <option value="Other">Other</option>
                    </select>
                    {editType === 'App Review' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button type="button" key={star} onClick={() => setEditRating(star)} className="focus:outline-none">
                             <Star className={`w-6 h-6 ${star <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                           </button>
                        ))}
                      </div>
                    )}
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bento-input min-h-[80px]" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                      <button onClick={() => handleUpdate(fb.id)} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={fb.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        fb.type === 'Bug' ? 'bg-red-100 text-red-700' :
                        fb.type === 'App Review' ? 'bg-yellow-100 text-yellow-700' :
                        fb.type === 'Feature Request' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {fb.type}
                      </span>
                      {fb.type === 'App Review' && fb.rating && (
                        <span className="flex items-center text-yellow-500">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating! ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </span>
                      )}
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(fb.date), 'dd MMM yyyy')}
                      </span>
                    </div>
                    {canEditDelete && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingId(fb.id); setEditType(fb.type); setEditText(fb.text); setEditRating(fb.rating || 5); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(fb.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-slate-800 text-sm mb-4 whitespace-pre-wrap">{fb.text}</p>
                  
                  {fb.reply && (
                    <div className="mb-4 ml-6 p-4 bg-slate-50 rounded-lg border-l-2 border-blue-500">
                      <div className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> Admin Reply:</div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{fb.reply}</p>
                    </div>
                  )}

                  {!fb.reply && isAdmin && replyingId !== fb.id && (
                    <button onClick={() => setReplyingId(fb.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1">
                      <Reply className="w-3 h-3" /> Add Reply
                    </button>
                  )}

                  {replyingId === fb.id && (
                    <div className="mb-4 ml-6 space-y-2">
                       <textarea value={replyText} onChange={e => setReplyText(e.target.value)} className="w-full bento-input text-sm p-2 min-h-[60px]" placeholder="Type reply..."></textarea>
                       <div className="flex gap-2">
                         <button onClick={() => setReplyingId(null)} className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancel</button>
                         <button onClick={() => handleReply(fb.id)} className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700">Send</button>
                       </div>
                    </div>
                  )}

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
