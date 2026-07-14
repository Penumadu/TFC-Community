'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/index'
import { Briefcase, PlusCircle } from 'lucide-react'
import { auth, db } from '@/lib/firebase/client'
import { collection, addDoc } from 'firebase/firestore'

export default function DirectoryForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    company_name: '',
    short_description: '',
    category: 'Plumbing',
    speaks_telugu: true,
    emergency_24_7: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
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
      if (!user) throw new Error('You must be logged in to list a service.')

      await addDoc(collection(db, 'tradespeople'), {
        ...formData,
        profile_id: user.uid,
        community_vouched: false, // New listings aren't vouched yet
        avg_rating: 0,
        is_active: true
      })
      router.push('/directory')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text">List your Service</h2>
            <p className="text-sm text-text-muted">Add your trade or business to the directory.</p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 rounded-md p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="company_name" className="block text-sm font-semibold text-text mb-1.5">
              Business / Company Name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              className="input w-full"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g. Sri Venkateswara Plumbing"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-text mb-1.5">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="input w-full"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Catering">Catering</option>
              <option value="Tutoring">Tutoring</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="short_description" className="block text-sm font-semibold text-text mb-1.5">
              Short Description
            </label>
            <textarea
              id="short_description"
              name="short_description"
              className="input w-full min-h-[100px]"
              value={formData.short_description}
              onChange={handleChange}
              placeholder="Briefly describe your services..."
              required
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="speaks_telugu"
                checked={formData.speaks_telugu}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Fluent in Telugu
            </label>
            <label className="flex items-center gap-2 text-sm text-text font-medium">
              <input
                type="checkbox"
                name="emergency_24_7"
                checked={formData.emergency_24_7}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Available for 24/7 Emergencies
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/directory')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Publish Service
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
