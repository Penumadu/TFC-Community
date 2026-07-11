import Header from '@/components/layout/Header'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'
import { db } from '@/lib/firebase/client'
import { doc, getDoc } from 'firebase/firestore'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionCookie = (await cookies()).get('session')?.value || ''

  if (!sessionCookie) {
    redirect('/login')
  }

  let decodedClaims: any = null;
  if (sessionCookie) {
    decodedClaims = { uid: sessionCookie, phone_number: '' }
  }

  if (!decodedClaims) {
    redirect('/login')
  }
  const profileDoc = await getDoc(doc(db, 'profiles', decodedClaims.uid))
  const profile = profileDoc.exists() ? profileDoc.data() : null

  const displayName = profile?.display_name || (decodedClaims.phone_number ? 'Verified User' : 'Guest User')
  const isAdmin = profile?.is_admin === true;

  return (
    <>
      <Header isAuthenticated={true} userDisplayName={displayName} isAdmin={isAdmin} />
      <main id="main-content" className="flex-1 bg-bg">
        {children}
      </main>
      <footer className="bg-secondary text-white/60 py-6 text-center text-sm" role="contentinfo">
        <span>TFC Community Portal — Halton Region & GTA</span>
      </footer>
    </>
  )
}
