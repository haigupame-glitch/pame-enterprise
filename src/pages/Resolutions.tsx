import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';

export function Resolutions() {
  const { resolutions, activeGroupId, addResolution } = useAppContext();
  const [text, setText] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const groupResolutions = resolutions.filter(r => r.groupId === activeGroupId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
      
      <div className="lg:col-span-8 space-y-6">
        <h2 className="card-header ml-2">PAST MEETING RESOLUTIONS</h2>
        {groupResolutions.length === 0 && <p className="text-app-muted text-sm ml-2">No resolutions recorded yet.</p>}
        {groupResolutions.map(res => (
          <div key={res.id} className="bento-card relative">
            <div className="absolute top-4 right-4">
               <span className="notice-pill !m-0 !py-1 !px-2 text-xs font-bold font-mono text-app-primary">
                 {format(new Date(res.date), 'dd MMM yyyy')}
               </span>
            </div>
            <h3 className="text-md font-bold text-app-text mb-2 font-mono uppercase">Resolution Record</h3>
            <div className="w-8 h-1 bg-app-primary mb-4 rounded-full"></div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{res.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
