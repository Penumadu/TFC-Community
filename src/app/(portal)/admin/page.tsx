import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/firebase/client'
import { collection, query, where, getDocs, getDoc, doc, getCountFromServer } from 'firebase/firestore'
import ModerationTable from '@/components/admin/ModerationTable'
import { Users, Store, Building2, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | TFC Community Portal',
}

export default async function AdminDashboardPage() {
  const sessionCookie = (await cookies()).get('session')?.value
  
  if (!sessionCookie) {
    redirect('/login')
  }

  // 1. Verify Admin Status
  const profileDoc = await getDoc(doc(db, 'profiles', sessionCookie))
  const profileData = profileDoc.exists() ? profileDoc.data() : null

  if (!profileData || profileData.is_admin !== true) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 text-center animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-danger mx-auto mb-4" />
        <h1 className="font-heading font-bold text-3xl text-text mb-2">Access Denied</h1>
        <p className="text-text-muted">You do not have permission to view the admin dashboard.</p>
      </div>
    )
  }

  // 2. Fetch Metrics
  const tradespeopleQuery = query(collection(db, 'tradespeople'), where('is_active', '==', true))
  const venuesQuery = query(collection(db, 'venues'), where('is_active', '==', true))
  const childcareQuery = query(collection(db, 'childcare_providers'), where('is_active', '==', true))

  const [tradespeopleSnap, venuesSnap, childcareSnap] = await Promise.all([
    getCountFromServer(tradespeopleQuery),
    getCountFromServer(venuesQuery),
    getCountFromServer(childcareQuery)
  ])

  // 3. Fetch Pending Venues for Moderation
  const pendingVenuesQuery = query(
    collection(db, 'venues'),
    where('admin_verified', '==', false)
  )
  const pendingVenuesSnap = await getDocs(pendingVenuesQuery)
  const pendingVenues = pendingVenuesSnap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }))

  const statCards = [
    { label: 'Active Directory Listings', value: tradespeopleSnap.data().count, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Verified Venues', value: venuesSnap.data().count, icon: Building2, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Childcare Providers', value: childcareSnap.data().count, icon: Store, color: 'text-teal', bg: 'bg-teal/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-text mb-2">Admin Dashboard</h1>
        <p className="text-text-muted">Platform metrics and community moderation tools.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-surface border border-gray-100 rounded-xl p-6 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Moderation Section */}
      <div className="mb-6">
        <h2 className="font-heading font-bold text-2xl text-text mb-2">Pending Venues</h2>
        <p className="text-text-muted text-sm mb-6">Review and approve new venue submissions before they appear publicly.</p>
        
        <ModerationTable venues={pendingVenues} />
      </div>
    </div>
  )
}
