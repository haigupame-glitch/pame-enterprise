import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId, formatCurrency, resizeImage } from '../lib/utils';
import { format } from 'date-fns';
import { Upload, X, Pencil, Trash2 } from 'lucide-react';

export function Activities() {
  const { activities, activeGroupId, addActivity, updateActivity, deleteActivity, currentUserRole } = useAppContext();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState('');
  const [cost, setCost] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editParticipants, setEditParticipants] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);

  const groupActivities = activities
    .filter(a => a.groupId === activeGroupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files) as File[]) {
      try {
        const result = await resizeImage(file, 800);
        if (isEdit) {
           setEditPhotos(prev => [...prev, result]);
        } else {
           setPhotos(prev => [...prev, result]);
        }
      } catch (err) {
        console.error('Failed to resize log', err);
      }
    }
  };

  const removePhoto = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
       setEditPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
       setPhotos(prev => prev.filter((_, i) => i !== index));
    }
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

  const handleUpdate = (id: string) => {
    if (!editTitle || !editDescription || !editDate) return;
    const a = activities.find(x => x.id === id);
    if (!a) return;
    updateActivity({
      ...a,
      date: editDate,
      title: editTitle,
      description: editDescription,
      participants: parseInt(editParticipants) || 0,
      cost: parseFloat(editCost) || 0,
      photoUrls: editPhotos,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
     if (confirm("Are you sure you want to delete this activity?")) {
        deleteActivity(id);
     }
  };

  const startEdit = (activity: typeof activities[0]) => {
     setEditingId(activity.id);
     setEditDate(activity.date);
     setEditTitle(activity.title);
     setEditDescription(activity.description);
     setEditParticipants(activity.participants.toString());
     setEditCost(activity.cost.toString());
     setEditPhotos(activity.photoUrls || []);
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
                    <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200">
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
                  <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-md cursor-pointer text-slate-500 hover:text-blue-500 transition-colors bg-slate-50">
                    <Upload className="w-5 h-5" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e)} />
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
        
        {groupActivities.length > 0 && (() => {
          const allPhotos = groupActivities.flatMap(a => a.photoUrls?.map(url => ({ url, title: a.title, date: a.date })) || []);
          if (allPhotos.length === 0) return null;
          return (
            <div className="mb-8 p-4 bg-app-card rounded-xl border border-app-border shadow-sm">
              <h2 className="card-header ml-2 mb-4">ACTIVITY PHOTO GALLERY</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {allPhotos.map((photo, i) => (
                  <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" className="relative group shrink-0 w-64 h-48 rounded-xl overflow-hidden shadow-sm snap-start border border-app-border cursor-pointer">
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <span className="text-white text-sm font-bold line-clamp-2 leading-tight">{photo.title}</span>
                      <span className="text-white/70 text-xs font-mono mt-1">{format(new Date(photo.date), 'MMM yyyy')}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        <h2 className="card-header ml-2">GROUP ACTIVITY HISTORY</h2>
        {groupActivities.length === 0 && <p className="text-app-muted text-sm ml-2">No activities recorded yet.</p>}
        {groupActivities.map(activity => {
          if (editingId === activity.id) {
             return (
               <div key={activity.id} className="bento-card border-l-4 border-l-app-primary space-y-4">
                 <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bento-input" />
                 <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bento-input w-full" />
                 <textarea rows={4} value={editDescription} onChange={e => setEditDescription(e.target.value)} className="bento-input w-full" />
                 
                 <div className="flex flex-wrap gap-2 mb-2">
                   {editPhotos.map((photo, idx) => (
                     <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200">
                       <img src={photo} alt="" className="w-full h-full object-cover" />
                       <button type="button" onClick={() => removePhoto(idx, true)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md hover:bg-red-600"><X className="w-3 h-3" /></button>
                     </div>
                   ))}
                   <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-md cursor-pointer text-slate-500">
                     <Upload className="w-5 h-5" />
                     <input type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoUpload(e, true)} />
                   </label>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <input type="number" value={editParticipants} onChange={e => setEditParticipants(e.target.value)} className="bento-input" placeholder="Participants" />
                   <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} className="bento-input" placeholder="Cost" step="0.01" />
                 </div>
                 
                 <div className="flex gap-2 justify-end pt-2 border-t border-app-border">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-semibold">Cancel</button>
                    <button onClick={() => handleUpdate(activity.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Changes</button>
                 </div>
               </div>
             );
          }

          return (
            <div key={activity.id} className="bento-card border-l-4 border-l-app-primary">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-app-text">{activity.title}</h3>
                    {canEdit && (
                       <div className="flex gap-1 ml-2">
                         <button onClick={() => startEdit(activity)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4"/></button>
                         <button onClick={() => handleDelete(activity.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    )}
                  </div>
                  <p className="text-sm font-mono text-app-muted mt-1">{format(new Date(activity.date), 'dd MMMM yyyy')}</p>
                </div>
                {(activity.participants > 0 || activity.cost > 0) && (
                  <div className="flex gap-3 bg-app-bg px-3 py-2 rounded-lg border border-app-border shrink-0 shadow-sm">
                    {activity.participants > 0 && (
                      <div className="text-center px-2">
                        <div className="text-xs font-bold text-app-muted">PEOPLE</div>
                        <div className="text-sm font-mono font-bold text-app-text">{activity.participants}</div>
                      </div>
                    )}
                    {activity.participants > 0 && activity.cost > 0 && (
                      <div className="w-[1px] bg-app-border"></div>
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
                    <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 overflow-hidden rounded-lg border border-app-border shadow-sm hover:opacity-90 transition-opacity">
                       <img src={photo} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              <div className="w-8 h-1 bg-app-accent mb-3 mt-4 rounded-full"></div>
              <p className="text-sm text-app-text whitespace-pre-wrap leading-relaxed">{activity.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
