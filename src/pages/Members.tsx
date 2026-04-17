import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';

export function Members() {
  const { members, activeGroupId, addMember } = useAppContext();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const groupMembers = members.filter(m => m.groupId === activeGroupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeGroupId) return;
    
    addMember({
      id: generateId(),
      groupId: activeGroupId,
      name: name.trim(),
      contact: contact.trim(),
      joinDate: new Date().toISOString(),
    });
    setName('');
    setContact('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bento-card">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="card-header">ADD MEMBER</div>
          <div className="flex gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="bento-input flex-auto"
              placeholder="Member Name"
            />
            <input
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              className="bento-input flex-auto"
              placeholder="Contact No. (Optional)"
            />
            <button
              type="submit"
              className="bento-btn bento-btn-primary flex-none"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>

      <div className="bento-card !p-0 overflow-hidden">
        <div className="p-4 border-b-2 border-app-border">
          <div className="card-header !mb-0">MEMBER DIRECTORY ({groupMembers.length} TOTAL)</div>
        </div>
        <div className="overflow-x-auto">
          <table className="bento-table">
            <thead>
              <tr>
                <th className="w-16">SL No.</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((member, idx) => (
                <tr key={member.id}>
                  <td className="text-app-muted font-mono">{idx + 1}</td>
                  <td className="font-bold">{member.name}</td>
                  <td className="font-mono text-sm">{member.contact || '-'}</td>
                  <td>{format(new Date(member.joinDate), 'dd MMM yyyy')}</td>
                </tr>
              ))}
              {groupMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-app-muted">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
