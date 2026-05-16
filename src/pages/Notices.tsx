import React from 'react';
import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';

export function Notices() {
  const { notices, activeGroupId, addNotice, currentUserRole } = useAppContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const groupNotices = notices.filter(n => n.groupId === activeGroupId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !title || !content) return;
    
    addNotice({
      id: generateId(),
      groupId: activeGroupId,
      date: new Date().toISOString(),
      title,
      content,
    });
    
    setTitle('');
    setContent('');
  };

  const shareToWhatsApp = (notice: typeof notices[0]) => {
    const text = `*NOTICE: ${notice.title}*\nDate: ${format(new Date(notice.date), 'dd MMM yyyy')}\n\n${notice.content}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {canEdit && (
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card">
            <div className="card-header">CREATE NOTICE</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Title / Subject</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Content</label>
                <textarea rows={4} value={content} onChange={e => setContent(e.target.value)} required className="bento-input resize-y" />
              </div>
              <button type="submit" className="bento-btn bento-btn-primary w-full">Post Notice</button>
            </form>
          </div>
        </div>
      )}
      
      <div className={`space-y-4 ${canEdit ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
        <h2 className="card-header ml-2">RECENT NOTICES</h2>
        {groupNotices.length === 0 && <p className="text-app-muted text-sm ml-2">No notices posted yet.</p>}
        {groupNotices.map(notice => (
          <div key={notice.id} className="bento-card border-l-4 border-l-app-primary">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-md font-extrabold text-app-text">{notice.title}</h3>
                <p className="text-xs font-mono text-app-muted mt-1">{format(new Date(notice.date), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              <button 
                onClick={() => shareToWhatsApp(notice)}
                className="bento-btn bento-btn-accent !py-1.5 shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.666.598 1.236.782 1.409.867.173.087.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                </svg>
                WhatsApp
              </button>
            </div>
            <div className="w-8 h-1 bg-app-accent mb-3 mt-3 rounded-full"></div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
