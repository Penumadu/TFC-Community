import ChildcareForm from '@/components/childcare/ChildcareForm'

export const metadata = {
  title: 'Add Childcare Provider - TFC Community Portal',
  description: 'List your childcare services in the Halton/GTA Telugu community directory.',
}

export default function NewChildcarePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text">List as a Provider</h1>
        <p className="text-text-muted mt-2">
          Offer your childcare services to community families.
        </p>
      </div>
      
      <ChildcareForm />
    </div>
  )
}
