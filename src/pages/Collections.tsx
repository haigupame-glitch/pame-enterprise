import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { generateId } from '../lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Collections() {
  const { members, collections, activeGroupId, saveCollection, currentUserRole } = useAppContext();
  const [year, setYear] = useState(new Date().getFullYear());

  const groupMembers = members.filter(m => m.groupId === activeGroupId);
  
  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';

  const handleAmountChange = (memberId: string, month: number, value: string) => {
    if (!activeGroupId) return;
    const amount = value ? parseFloat(value) : 0;
    saveCollection({
      id: generateId(),
      groupId: activeGroupId,
      memberId,
      year,
      month,
      amount
    });
  };

  const getAmount = (memberId: string, month: number) => {
    const col = collections.find(c => c.groupId === activeGroupId && c.memberId === memberId && Number(c.year) === Number(year) && Number(c.month) === Number(month));
    return col && !isNaN(col.amount) ? col.amount : '';
  };

  return (
    <div className="space-y-6">
      <div className="bento-card">
        <div className="card-header !mb-0 flex justify-between items-center w-full">
          <span>MONTHLY COLLECTIONS</span>
          <div className="flex items-center gap-2">
            <label className="label-small text-app-muted">FOR YEAR:</label>
            <input 
              type="number" 
              value={year} 
              onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="bento-input !py-1 w-24 text-center font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bento-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="bento-table">
            <thead>
              <tr>
                <th scope="col" className="w-12 text-center border-r border-app-border">SL.</th>
                <th scope="col" className="min-w-[150px] border-r border-app-border">Name</th>
                {MONTHS.map(month => (
                  <th key={month} scope="col" className="text-center min-w-[80px] border-r border-app-border !px-2">
                    {month.slice(0, 3)}
                  </th>
                ))}
                <th scope="col">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((member, idx) => (
                <tr key={member.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="text-center font-mono text-app-muted border-r border-app-border">{idx + 1}</td>
                  <td className="font-bold border-r border-app-border">{member.name}</td>
                  {MONTHS.map((_, mIdx) => (
                    <td key={mIdx} className="!p-0 border-r border-app-border">
                      <input
                        type="number"
                        value={getAmount(member.id, mIdx)}
                        onChange={e => handleAmountChange(member.id, mIdx, e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-transparent border-0 text-center text-sm p-3 focus:ring-2 focus:ring-inset focus:ring-app-primary font-mono disabled:opacity-50"
                      />
                    </td>
                  ))}
                  <td className="!p-0">
                    <input
                      type="text"
                      disabled={!canEdit}
                      className="w-full bg-transparent border-0 text-sm p-3 focus:ring-2 focus:ring-inset focus:ring-app-primary disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
              {groupMembers.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-app-muted font-bold">
                    Add members to start collecting fees.
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
