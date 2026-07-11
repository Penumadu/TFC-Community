import { Suspense } from 'react'
import { adminAuth } from '@/lib/firebase/server'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, limit, getDoc, doc, orderBy } from 'firebase/firestore'
import { cookies } from 'next/headers'
import { Clock, Plus, ArrowUpRight, ArrowDownRight, History } from 'lucide-react'
import { Card, Badge, Skeleton } from '@/components/ui/index'

export const metadata = {
  title: 'Co-op Time Banking',
  description: 'Exchange childcare hours with other trusted parents in the community',
}

export default async function CoopPage() {
  const sessionCookie = (await cookies()).get('session')?.value || ''
  
  let userId = '';
  if (sessionCookie) {
    userId = sessionCookie;
  }

  if (!userId) {
    return <div>Unauthorized</div>
  }// Fetch balance
  const balanceDoc = await getDoc(doc(db, 'coop_balances', userId))
  const balanceData = balanceDoc.exists() ? balanceDoc.data() : null

  const balance = balanceData?.balance ?? 0
  const hoursEarned = balanceData?.hours_earned ?? 0
  const hoursSpent = balanceData?.hours_spent ?? 0

  // Fetch recent ledger entries
  const ledgerQ = query(
    collection(db, 'coop_ledger'),
    where('parent_id', '==', userId),
    orderBy('session_date', 'desc'),
    limit(10)
  )
  const ledgerSnap = await getDocs(ledgerQ)
    
  const ledger = ledgerSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  
  // Manual join with profiles
  await Promise.all(ledger.map(async (entry) => {
    if (entry.counterpart_id) {
      const pDoc = await getDoc(doc(db, 'profiles', entry.counterpart_id))
      entry.counterpart = pDoc.exists() ? pDoc.data() : { display_name: 'Unknown', avatar_url: null }
    } else {
      entry.counterpart = { display_name: 'Unknown', avatar_url: null }
    }
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <Clock className="w-7 h-7 text-secondary" aria-hidden="true" />
            Co-op Time Banking
          </h1>
          <p className="section-subtitle">
            Trade babysitting hours with trusted local parents. 1 hour earned = 1 hour spent.
          </p>
        </div>
        
        <button className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Log Hours
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <Card className="p-6 bg-gradient-teal text-white shadow-glow-teal border-none">
          <p className="text-white/80 text-sm font-medium mb-1">Current Balance</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-heading font-bold">{balance}</span>
            <span className="text-white/80 pb-1">hrs</span>
          </div>
        </Card>

        <Card className="p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-success mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium text-text-muted">Hours Earned</span>
          </div>
          <div className="text-2xl font-bold text-text">{hoursEarned} <span className="text-sm font-normal text-text-muted">hrs</span></div>
        </Card>

        <Card className="p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-danger mb-1">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-sm font-medium text-text-muted">Hours Spent</span>
          </div>
          <div className="text-2xl font-bold text-text">{hoursSpent} <span className="text-sm font-normal text-text-muted">hrs</span></div>
        </Card>
      </div>

      {/* Ledger History */}
      <div>
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-secondary" />
          Recent Transactions
        </h2>

        <Suspense fallback={<LedgerSkeleton />}>
          {!ledger || ledger.length === 0 ? (
            <Card className="p-10 text-center border border-gray-100 shadow-sm">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-text">No transactions yet</p>
              <p className="text-sm text-text-muted mt-1">
                When you exchange childcare hours with another parent, it will show up here.
              </p>
            </Card>
          ) : (
            <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100" role="list">
                {ledger.map((entry) => {
                  // Type assertion for Supabase relation
                  const counterpart = entry.counterpart as unknown as { display_name: string, avatar_url: string | null }
                  const isCredit = entry.transaction_type === 'credit'
                  const isConfirmed = entry.confirmed_by_parent && entry.confirmed_by_counterpart
                  
                  return (
                    <li key={entry.id} className="p-4 sm:px-6 hover:bg-bg transition-colors flex items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        
                        <div>
                          <p className="font-semibold text-text text-sm sm:text-base">
                            {isCredit ? 'Earned from' : 'Spent with'} {counterpart?.display_name || 'Unknown User'}
                          </p>
                          <p className="text-xs sm:text-sm text-text-muted line-clamp-1">
                            {entry.description || 'Childcare exchange'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">
                              {entry.session_date?.toDate ? new Date(entry.session_date.toDate()).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : entry.session_date}
                            </span>
                            {!isConfirmed && (
                              <Badge variant="orange" className="!px-1.5 !py-0 !text-[10px]">Pending Confirmation</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`font-mono font-bold text-lg whitespace-nowrap ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}{entry.hours}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Suspense>
      </div>

    </div>
  )
}

function LedgerSkeleton() {
  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="w-12 h-6 rounded" />
        </div>
      ))}
    </div>
  )
}
