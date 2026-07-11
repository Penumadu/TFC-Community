'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/index'
import { Save, UserCircle } from 'lucide-react'
import { db } from '@/lib/firebase/client'
import { doc, setDoc } from 'firebase/firestore'

type ProfileData = {
  display_name?: string;
  halton_town?: string;
  availability?: string;
}

interface ProfileFormProps {
  userId: string;
  initialData: ProfileData;
}

export default function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ProfileData>({
    display_name: initialData.display_name || '',
    halton_town: initialData.halton_town || 'Milton',
    availability: initialData.availability || 'online'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const userRef = doc(db, 'profiles', userId)
      await setDoc(userRef, formData, { merge: true })
      setSuccess(true)
      router.refresh() // Refresh to update layout header
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text">Personal Information</h2>
            <p className="text-sm text-text-muted">Update your community profile details.</p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 rounded-md p-3 text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success/10 text-success border border-success/20 rounded-md p-3 text-sm mb-6">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="display_name" className="block text-sm font-semibold text-text mb-1.5">
              Display Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              className="input w-full"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="How others see you in the portal"
              required
            />
          </div>

          <div>
            <label htmlFor="halton_town" className="block text-sm font-semibold text-text mb-1.5">
              Halton Region Town
            </label>
            <select
              id="halton_town"
              name="halton_town"
              className="input w-full"
              value={formData.halton_town}
              onChange={handleChange}
            >
              <option value="Milton">Milton</option>
              <option value="Oakville">Oakville</option>
              <option value="Burlington">Burlington</option>
              <option value="Halton Hills">Halton Hills</option>
            </select>
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-semibold text-text mb-1.5">
              Co-op Availability
            </label>
            <select
              id="availability"
              name="availability"
              className="input w-full"
              value={formData.availability}
              onChange={handleChange}
            >
              <option value="online">Available to help</option>
              <option value="offline">Currently busy</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              Let the community know if you are currently taking co-op requests.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
