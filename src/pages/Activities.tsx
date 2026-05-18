import React from 'react';
import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency, resizeImage } from '../lib/utils';
import { format } from 'date-fns';
import { Upload, X } from 'lucide-react';

export function Activities() {
  const { activities, activeGroupId, addActivity, currentUserRole } = useAppContext();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState('');
  const [cost, setCost] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const groupActivities = activities
    .filter(a => a.groupId === activeGroupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files) as File[]) {
      try {
        const result = await resizeImage(file, 800);
        setPhotos(prev => [...prev, result]);
      } catch (err) {
        console.error('Failed to resize log', err);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId || !title || !description || !date) return;

    addActivity({
      id: generateId(),
      groupId: activeGroupId,
      date,
      title,
      description,
      participants: parseInt(participants) || 0,
      cost: parseFloat(cost) || 0,
      photoUrls: photos,
    });

    setTitle('');
    setDescription('');
    setParticipants('');
    setCost('');
    setPhotos([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {canEdit && (
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card">
            <div className="card-header">LOG NEW ACTIVITY</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-small mb-1 block">Date of Activity</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bento-input" />
              </div>
              <div>
                <label className="label-small mb-1 block">Activity Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="bento-input" placeholder="e.g. Tree Plantation Drive" />
              </div>
              <div>
                <label className="label-small mb-1 block">Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} required className="bento-input resize-y" placeholder="Activity details..." />
              </div>
              
              <div>
                <label className="label-small mb-1 block">Photos (Optional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-700">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-md cursor-pointer text-slate-500 hover:text-emerald-500 transition-colors bg-slate-800/50">
                    <Upload className="w-5 h-5" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-small mb-1 block">Participants</label>
                  <input type="number" value={participants} onChange={e => setParticipants(e.target.value)} className="bento-input" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="label-small mb-1 block">Total Cost</label>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="bento-input" placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="bento-btn bento-btn-primary w-full">Save Activity Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className={`space-y-4 ${canEdit ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
        <h2 className="card-header ml-2">GROUP ACTIVITY HISTORY</h2>
        {groupActivities.length === 0 && <p className="text-app-muted text-sm ml-2">No activities recorded yet.</p>}
        {groupActivities.map(activity => (
          <div key={activity.id} className="bento-card border-l-4 border-l-app-primary">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-app-text">{activity.title}</h3>
                <p className="text-sm font-mono text-app-muted mt-1">{format(new Date(activity.date), 'dd MMMM yyyy')}</p>
              </div>
              {(activity.participants > 0 || activity.cost > 0) && (
                <div className="flex gap-3 bg-app-bg px-3 py-2 rounded-lg border-2 border-app-border shrink-0">
                  {activity.participants > 0 && (
                    <div className="text-center px-2">
                      <div className="text-xs font-bold text-app-muted">PEOPLE</div>
                      <div className="text-sm font-mono font-bold text-app-text">{activity.participants}</div>
                    </div>
                  )}
                  {activity.participants > 0 && activity.cost > 0 && (
                    <div className="w-0.5 bg-app-border"></div>
                  )}
                  {activity.cost > 0 && (
                    <div className="text-center px-2">
                      <div className="text-xs font-bold text-app-muted">COST</div>
                      <div className="text-sm font-mono font-bold text-app-primary">{formatCurrency(activity.cost)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {activity.photoUrls && activity.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 my-4">
                {activity.photoUrls.map((photo, idx) => (
                  <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="block max-w-[200px] h-32 overflow-hidden rounded-lg border border-slate-200 shadow-sm hover:opacity-90 transition-opacity">
                     <img src={photo} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            <div className="w-8 h-1 bg-app-accent mb-3 mt-4 rounded-full"></div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{activity.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
