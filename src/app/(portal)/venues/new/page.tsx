import VenueForm from '@/components/venues/VenueForm'

export const metadata = {
  title: 'Submit Venue - TFC Community Portal',
  description: 'Suggest a new venue for the Halton/GTA Telugu community.',
}

export default function NewVenuePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text">Suggest Venue</h1>
        <p className="text-text-muted mt-2">
          Help us grow our directory of community-friendly venues.
        </p>
      </div>
      
      <VenueForm />
    </div>
  )
}
