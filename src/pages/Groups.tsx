import { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';

export function Groups() {
  const { groups, activeGroupId, addGroup, updateConstitution } = useAppContext();
  const [name, setName] = useState('');

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const [constitutionText, setConstitutionText] = useState('');

  useEffect(() => {
    if (activeGroup) {
      setConstitutionText(activeGroup.constitution || '');
    }
  }, [activeGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    addGroup({
      id: generateId(),
      name: name.trim(),
      createdDate: new Date().toISOString(),
      constitution: '',
    });
    setName('');
  };

  const handleUpdateConstitution = () => {
    if (activeGroupId) {
      updateConstitution(activeGroupId, constitutionText);
      alert('Constitution saved successfully!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bento-card">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="card-header">CREATE NEW GROUP</div>
              <div className="flex gap-x-4">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bento-input flex-auto"
                  placeholder="e.g. Mahila Samiti SHG"
                />
                <button
                  type="submit"
                  className="bento-btn bento-btn-primary flex-none"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>

          <div className="bento-card !p-0 overflow-hidden">
            <div className="p-4 border-b-2 border-app-border">
              <div className="card-header !mb-0">ALL GROUPS</div>
            </div>
            <div className="overflow-x-auto">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td className="font-bold">{group.name}</td>
                      <td>{format(new Date(group.createdDate), 'dd MMM yyyy')}</td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-app-muted">
                        No groups created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {activeGroup && (
          <div className="bento-card flex-col h-[600px] !p-0 overflow-hidden">
            <div className="p-4 border-b-2 border-app-border bg-gray-50 flex justify-between items-center shrink-0">
              <div className="card-header !mb-0">GROUP CONSTITUTION</div>
              <button
                onClick={handleUpdateConstitution}
                className="bento-btn py-1 px-3 text-xs"
              >
                Save
              </button>
            </div>
            <div className="p-4 bg-app-card shrink-0 border-b border-gray-200">
              <p className="text-xs text-app-muted">Draft rules and regulations for <strong>{activeGroup.name}</strong></p>
            </div>
            <textarea
              className="flex-1 w-full border-0 py-4 px-6 text-app-text focus:ring-0 resize-none font-mono text-sm leading-relaxed"
              placeholder="1. Name of the group...&#10;2. Aims and objectives...&#10;3. Membership criteria..."
              value={constitutionText}
              onChange={(e) => setConstitutionText(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
