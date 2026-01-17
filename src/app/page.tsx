import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-100 p-8">
      <main className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-heading text-4xl font-bold text-white">
          Blindtest
        </h1>

        {/* Color palette demo - Light background */}
        <Card className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-dark-100">
            Palette sur fond clair
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </Card>

        {/* Color palette demo - Dark background */}
        <section className="rounded-xl bg-dark-200 p-6">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-white">
            Palette sur fond sombre
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
          <p className="mt-4 text-dark-800">
            Les couleurs sont visibles et contrastées sur fond sombre.
          </p>
        </section>
      </main>
    </div>
  )
}
