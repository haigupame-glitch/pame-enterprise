import { useAppContext } from '../store/AppContext';
import { Users, Building, Wallet, ScrollText } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { groups, members, transactions, activeGroupId } = useAppContext();
  
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const groupMembers = members.filter(m => m.groupId === activeGroupId);
  const groupTransactions = transactions.filter(t => t.groupId === activeGroupId);
  
  const latestBalance = groupTransactions.length > 0 ? groupTransactions[groupTransactions.length - 1].runningBalance : 0;

  return (
    <div className="space-y-6">
      {!activeGroupId && (
        <div className="bento-card border-app-primary bg-indigo-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-app-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-app-primary">
                Please select or <Link to="/groups" className="underline hover:text-indigo-800">create a group</Link> to start managing data.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bento-card justify-between min-h-[140px]">
          <div className="card-header">
            TOTAL GROUPS
            <Building className="h-4 w-4 text-app-muted" />
          </div>
          <div className="stat-huge">{groups.length}</div>
        </div>
        
        {activeGroupId && (
          <>
            <div className="bento-card justify-between min-h-[140px]">
              <div className="card-header">
                ACTIVE MEMBERS
                <Users className="h-4 w-4 text-app-accent" />
              </div>
              <div className="stat-huge text-app-accent">{groupMembers.length}</div>
            </div>

            <div className="bento-card justify-between min-h-[140px]">
              <div className="card-header">
                RUNNING BALANCE
                <Wallet className="h-4 w-4 text-app-primary" />
              </div>
              <div className="stat-huge text-app-primary bg-indigo-50 border border-app-primary rounded px-2 -mx-2">{formatCurrency(latestBalance)}</div>
            </div>

            <div className="bento-card justify-between min-h-[140px]">
              <div className="card-header">
                TOTAL TRANSACTIONS
                <ScrollText className="h-4 w-4 text-app-muted" />
              </div>
              <div className="stat-huge">{groupTransactions.length}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
