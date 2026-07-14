'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/index'
import { Building2, PlusCircle } from 'lucide-react'
import { db } from '@/lib/firebase/client'
import { collection, addDoc } from 'firebase/firestore'

export default function VenueForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: 'Milton',
    venue_type: 'Hall',
    dedicated_veg_kitchen: false,
    external_catering_allowed: false,
    alcohol_allowed: false,
    max_capacity: 50,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      await addDoc(collection(db, 'venues'), {
        ...formData,
        avg_rating: 0,
        is_active: true,
        admin_verified: false // Requires admin approval!
      })
      router.push('/venues')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit venue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text">Submit a Venue</h2>
            <p className="text-sm text-text-muted">Suggest a new venue for the community.</p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 rounded-md p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-text mb-1.5">
              Venue Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="input w-full"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Milton Community Hall"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-text mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="input w-full min-h-[100px]"
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly describe the venue..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-text mb-1.5">
                City
              </label>
              <select
                id="city"
                name="city"
                className="input w-full"
                value={formData.city}
                onChange={handleChange}
              >
                <option value="Milton">Milton</option>
                <option value="Oakville">Oakville</option>
                <option value="Burlington">Burlington</option>
                <option value="Halton Hills">Halton Hills</option>
              </select>
            </div>
            <div>
              <label htmlFor="venue_type" className="block text-sm font-semibold text-text mb-1.5">
                Venue Type
              </label>
              <select
                id="venue_type"
                name="venue_type"
                className="input w-full"
                value={formData.venue_type}
                onChange={handleChange}
              >
                <option value="Hall">Hall</option>
                <option value="Park">Park</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Temple">Temple</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="max_capacity" className="block text-sm font-semibold text-text mb-1.5">
              Maximum Capacity
            </label>
            <input
              id="max_capacity"
              name="max_capacity"
              type="number"
              min="1"
              className="input w-full"
              value={formData.max_capacity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="dedicated_veg_kitchen"
                checked={formData.dedicated_veg_kitchen}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Dedicated Vegetarian Kitchen
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="external_catering_allowed"
                checked={formData.external_catering_allowed}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              External Catering Allowed
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="alcohol_allowed"
                checked={formData.alcohol_allowed}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Alcohol Allowed
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/venues')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Submit Venue
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
