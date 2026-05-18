import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';

export function Constitution() {
  const { groups, activeGroupId, updateGroup, currentUserRole } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [constitutionText, setConstitutionText] = useState('');

  useEffect(() => {
    if (activeGroup) {
      setConstitutionText(activeGroup.constitution || '');
    }
  }, [activeGroup]);

  if (!activeGroupId || !activeGroup) {
    return <div className="text-app-muted">Please select a group first.</div>;
  }

  const handleSave = () => {
    updateGroup(activeGroupId, { constitution: constitutionText });
    setIsEditing(false);
  };

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-app-card p-4 rounded-xl border border-app-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app-text">Group Constitution</h1>
          <p className="text-app-muted text-sm mt-1">Rules, bylaws, and guidelines for {activeGroup.name}</p>
        </div>
        {canEdit && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bento-btn bento-btn-primary"
          >
            Edit Constitution
          </button>
        )}
      </div>

      <div className="bg-app-card border border-app-border rounded-xl p-6">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              className="w-full h-96 p-4 rounded-lg bg-slate-800 text-white border border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary resize-y"
              value={constitutionText}
              onChange={(e) => setConstitutionText(e.target.value)}
              placeholder="Enter the constitution text here..."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setConstitutionText(activeGroup.constitution || '');
                  setIsEditing(false);
                }}
                className="bento-btn bg-slate-700 text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bento-btn bento-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            {activeGroup.constitution ? (
              <div 
                className="whitespace-pre-wrap text-slate-300 font-medium leading-relaxed"
              >
                {activeGroup.constitution}
              </div>
            ) : (
              <div className="text-center py-12 text-app-muted">
                <p>No constitution has been added yet.</p>
                {canEdit && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-4 text-app-primary hover:underline"
                  >
                    Set one up now
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
