import DirectoryForm from '@/components/directory/DirectoryForm'

export const metadata = {
  title: 'Add Service - TFC Community Portal',
  description: 'List your trade or service in the Halton/GTA Telugu community directory.',
}

export default function NewDirectoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text">List your Service</h1>
        <p className="text-text-muted mt-2">
          Offer your professional services and trades to the community.
        </p>
      </div>
      
      <DirectoryForm />
    </div>
  )
}
