import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'
import { db } from '@/lib/firebase/client'
import { doc, getDoc } from 'firebase/firestore'
import ProfileForm from '@/components/profile/ProfileForm'
import { Skeleton } from '@/components/ui/index'

export const metadata = {
  title: 'My Profile | TFC Community Portal',
}

export default async function ProfilePage() {
  const sessionCookie = (await cookies()).get('session')?.value
  let userId = ''
  
  if (sessionCookie) {
    userId = sessionCookie
  }

  if (!userId) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 md:px-8">
        <h1 className="font-heading font-bold text-3xl text-text mb-2">My Profile</h1>
        <p className="text-text-muted">Please log in to view your profile.</p>
      </div>
    )
  }

  const profileDoc = await getDoc(doc(db, 'profiles', userId))
  const initialData = profileDoc.exists() ? profileDoc.data() : {
    display_name: '',
    halton_town: 'Milton',
    availability: 'online'
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 md:px-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-text mb-2">My Profile</h1>
        <p className="text-text-muted">Manage your personal settings and community preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="w-full h-96 rounded-xl" />}>
            <ProfileForm userId={userId} initialData={initialData as any} />
          </Suspense>
        </div>
        
        <div className="space-y-6">
          {/* We can add side widgets here, like a link to Admin dashboard if they are an admin */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-text mb-2">Community Guidelines</h3>
            <p className="text-sm text-text-muted mb-4">
              Please ensure your display name is recognizable to other community members.
              For trust and safety, your verified phone number remains private.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
