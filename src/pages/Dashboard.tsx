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
        <div className="bento-card border-app-primary/30 bg-app-primary/10">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-app-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-app-primary">
                Please select or <Link to="/groups" className="underline font-bold">create a group</Link> to start managing data.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeGroup && (
        <div 
          className="rounded-2xl border border-app-border text-white flex flex-col justify-center gap-6 p-6 sm:p-8 relative overflow-hidden min-h-[200px]"
          style={{
            backgroundImage: 'linear-gradient(to right, #1e293b, #0f172a)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-slate-950/50 pointer-events-none transition-all"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 w-full h-full my-auto">
            {activeGroup.logo ? (
              <img src={activeGroup.logo} alt="Group Logo" className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full border-4 border-slate-800 bg-app-card shrink-0 shadow-2xl" />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-800 bg-app-card shrink-0 shadow-2xl flex justify-center items-center">
                <Building className="w-10 h-10 text-app-muted" strokeWidth={1.5} />
              </div>
            )}
            <div className="text-center pb-1 sm:pb-2">
              <h1 className="text-3xl font-bold mb-1 tracking-tight text-white drop-shadow-md">{activeGroup.name}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bento-card relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-800/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="card-header">
            TOTAL GROUPS
            <Building className="h-4 w-4 text-app-muted" strokeWidth={1.5} />
          </div>
          <div className="stat-huge z-10 relative">{groups.length}</div>
        </div>
        
        {activeGroupId && (
          <>
            <div className="bento-card relative overflow-hidden group border-app-accent/30">
              <div className="absolute right-0 top-0 w-24 h-24 bg-app-accent/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="card-header">
                ACTIVE MEMBERS
                <Users className="h-4 w-4 text-app-accent" strokeWidth={1.5} />
              </div>
              <div className="stat-huge text-app-accent z-10 relative">{groupMembers.length}</div>
            </div>

            <div className="bento-card relative overflow-hidden group bg-app-primary/5 border-app-primary/30 lg:col-span-2">
              <div className="absolute right-0 top-0 w-48 h-48 bg-app-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="card-header !text-app-primary">
                RUNNING BALANCE
                <Wallet className="h-4 w-4 text-app-primary" strokeWidth={1.5} />
              </div>
              <div className="stat-huge text-app-primary text-4xl z-10 relative">{formatCurrency(latestBalance)}</div>
            </div>

            <div className="bento-card relative overflow-hidden group lg:col-span-4 flex flex-col md:flex-row items-center justify-between bg-slate-800/20">
               <div>
                  <div className="card-header border-b-0 mb-0 lg:mb-2">
                    TOTAL TRANSACTIONS
                    <ScrollText className="h-4 w-4 text-app-muted ml-2 inline-block" strokeWidth={1.5} />
                  </div>
                  <div className="stat-huge z-10 relative">{groupTransactions.length}</div>
               </div>
               <div className="mt-4 md:mt-0 flex gap-4">
                 <Link to="/transactions" className="bento-btn">View Transactions</Link>
                 <Link to="/reports" className="bento-btn bento-btn-primary">Generate Report</Link>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
