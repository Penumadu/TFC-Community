'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Card, Badge } from '@/components/ui/index'
import { CheckCircle, XCircle } from 'lucide-react'
import { db } from '@/lib/firebase/client'
import { doc, updateDoc } from 'firebase/firestore'

type PendingVenue = {
  id: string
  name: string
  city: string
  venue_type: string
  admin_verified: boolean
}

interface ModerationTableProps {
  venues: PendingVenue[]
}

export default function ModerationTable({ venues }: ModerationTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const handleApprove = async (venueId: string) => {
    setLoadingId(venueId)
    try {
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        admin_verified: true
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to approve venue:", error)
      alert("Failed to approve venue. Check console for details.")
    } finally {
      setLoadingId(null)
    }
  }

  if (venues.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50/50">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
        <h3 className="text-text font-medium text-lg">All Caught Up!</h3>
        <p className="text-text-muted text-sm mt-1">There are no pending venues to moderate.</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Venue Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">City</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {venues.map((venue) => (
              <tr key={venue.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-text">{venue.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {venue.city}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="teal">{venue.venue_type}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={loadingId === venue.id}
                    onClick={() => handleApprove(venue.id)}
                    leftIcon={<CheckCircle className="w-4 h-4 text-success" />}
                  >
                    Approve
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
