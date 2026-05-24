import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

export function Resolutions() {
  const { resolutions, activeGroupId, addResolution, updateResolution, deleteResolution, currentUserRole } = useAppContext();
  const [text, setText] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editText, setEditText] = useState('');

  const groupResolutions = resolutions.filter(r => r.groupId === activeGroupId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !text) return;
    
    addResolution({
      id: generateId(),
      groupId: activeGroupId,
      date,
      text,
    });
    
    setText('');
  };

  const handleUpdate = (id: string) => {
    if (!editText || !editDate) return;
    const r = resolutions.find(x => x.id === id);
    if (!r) return;
    updateResolution({ ...r, text: editText, date: editDate });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this resolution?")) {
      deleteResolution(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {canEdit && (
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card">
            <div className="card-header">RECORD BOARD RESOLUTION</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Date of Meeting</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Resolution Text</label>
                <textarea rows={6} value={text} onChange={e => setText(e.target.value)} required className="bento-input resize-y" placeholder="e.g. It was resolved that..." />
              </div>
              <button type="submit" className="bento-btn bento-btn-primary w-full">Save Resolution</button>
            </form>
          </div>
        </div>
      )}
      
      <div className={`space-y-6 ${canEdit ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
        <h2 className="card-header ml-2">PAST MEETING RESOLUTIONS</h2>
        {groupResolutions.length === 0 && <p className="text-app-muted text-sm ml-2">No resolutions recorded yet.</p>}
        {groupResolutions.map(res => {
          if (editingId === res.id) {
             return (
               <div key={res.id} className="bento-card space-y-4">
                 <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bento-input w-full" />
                 <textarea rows={6} value={editText} onChange={e => setEditText(e.target.value)} className="bento-input w-full" />
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-200 rounded">Cancel</button>
                   <button onClick={() => handleUpdate(res.id)} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                 </div>
               </div>
             );
          }

          return (
            <div key={res.id} className="bento-card relative">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                 {canEdit && (
                   <div className="flex gap-1 mr-2 bg-white/50 rounded-lg p-1">
                     <button onClick={() => { setEditingId(res.id); setEditDate(res.date); setEditText(res.text); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5"/></button>
                     <button onClick={() => handleDelete(res.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                   </div>
                 )}
                 <span className="notice-pill !m-0 !py-1 !px-2 text-xs font-bold font-mono text-app-primary shadow-sm bg-white border border-app-border">
                   {format(new Date(res.date), 'dd MMM yyyy')}
                 </span>
              </div>
              <h3 className="text-md font-bold text-app-text mb-2 font-mono uppercase">Resolution Record</h3>
              <div className="w-8 h-1 bg-app-primary mb-4 rounded-full"></div>
              <p className="text-sm text-app-text whitespace-pre-wrap leading-relaxed">{res.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
