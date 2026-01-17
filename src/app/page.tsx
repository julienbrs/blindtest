export default function Home() {
  return (
    <div className="min-h-screen bg-dark-100 p-8">
      <main className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-heading text-4xl font-bold text-white">
          Blindtest
        </h1>

        {/* Color palette demo - Light background */}
        <section className="mb-8 rounded-xl bg-white p-6">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-dark-100">
            Palette sur fond clair
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-600">
              Primary
            </button>
            <button className="rounded-lg bg-secondary-400 px-6 py-3 font-semibold text-dark-100 hover:bg-secondary-500">
              Secondary
            </button>
            <button className="rounded-lg bg-success px-6 py-3 font-semibold text-white">
              Success
            </button>
            <button className="rounded-lg bg-error px-6 py-3 font-semibold text-white">
              Error
            </button>
            <button className="rounded-lg bg-warning px-6 py-3 font-semibold text-dark-100">
              Warning
            </button>
          </div>
        </section>

        {/* Color palette demo - Dark background */}
        <section className="rounded-xl bg-dark-200 p-6">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-white">
            Palette sur fond sombre
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="rounded-lg bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-400">
              Primary
            </button>
            <button className="rounded-lg bg-secondary-400 px-6 py-3 font-semibold text-dark-100 hover:bg-secondary-300">
              Secondary
            </button>
            <button className="rounded-lg bg-success px-6 py-3 font-semibold text-white">
              Success
            </button>
            <button className="rounded-lg bg-error px-6 py-3 font-semibold text-white">
              Error
            </button>
            <button className="rounded-lg bg-warning px-6 py-3 font-semibold text-dark-100">
              Warning
            </button>
          </div>
          <p className="mt-4 text-dark-800">
            Les couleurs sont visibles et contrastées sur fond sombre.
          </p>
        </section>
      </main>
    </div>
  );
}
