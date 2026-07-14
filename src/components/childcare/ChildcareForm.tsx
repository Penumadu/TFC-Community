'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/index'
import { Baby, PlusCircle } from 'lucide-react'
import { auth, db } from '@/lib/firebase/client'
import { collection, addDoc } from 'firebase/firestore'

export default function ChildcareForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    provider_type: 'Home Daycare',
    years_experience: 1,
    vsc_verified: false,
    pure_vegetarian: false,
    peanut_free: false,
    cpr_certified: false,
    emergency_available: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) throw new Error('You must be logged in to list as a childcare provider.')

      await addDoc(collection(db, 'childcare_providers'), {
        ...formData,
        profile_id: user.uid,
        avg_rating: 0,
        is_active: true
      })
      router.push('/childcare')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit childcare profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Baby className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text">List as a Provider</h2>
            <p className="text-sm text-text-muted">Offer your childcare services to the community.</p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 rounded-md p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="provider_type" className="block text-sm font-semibold text-text mb-1.5">
                Provider Type
              </label>
              <select
                id="provider_type"
                name="provider_type"
                className="input w-full"
                value={formData.provider_type}
                onChange={handleChange}
              >
                <option value="Home Daycare">Home Daycare</option>
                <option value="Licensed Facility">Licensed Facility</option>
                <option value="Nanny/Babysitter">Nanny / Babysitter</option>
                <option value="Tutor & Care">Tutor & Care</option>
              </select>
            </div>
            <div>
              <label htmlFor="years_experience" className="block text-sm font-semibold text-text mb-1.5">
                Years of Experience
              </label>
              <input
                id="years_experience"
                name="years_experience"
                type="number"
                min="0"
                className="input w-full"
                value={formData.years_experience}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-text">Qualifications & Environment</h3>
            
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="vsc_verified"
                checked={formData.vsc_verified}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Vulnerable Sector Check (VSC) Verified
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="cpr_certified"
                checked={formData.cpr_certified}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              First Aid / CPR Certified
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="pure_vegetarian"
                checked={formData.pure_vegetarian}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Pure Vegetarian Environment
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="peanut_free"
                checked={formData.peanut_free}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Peanut-Free Environment
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="emergency_available"
                checked={formData.emergency_available}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Available for Emergency / Short-notice care
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/childcare')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Publish Profile
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
