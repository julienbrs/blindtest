/**
 * Component displayed when the browser doesn't support HTML5 Audio.
 * Shows an error message with suggestions for supported browsers.
 */

import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

export function BrowserUnsupportedError() {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
      data-testid="browser-unsupported-error"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
        <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-red-400">
        Navigateur non supporté
      </h2>
      <p className="mb-6 max-w-md text-purple-300">
        Votre navigateur ne supporte pas la lecture audio HTML5. Ce jeu
        nécessite un navigateur moderne pour fonctionner.
      </p>
      <div className="mb-6 rounded-lg bg-white/10 p-6 text-left">
        <p className="mb-3 font-semibold text-white">
          Navigateurs recommandés :
        </p>
        <ul className="space-y-2 text-purple-200">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Google Chrome (version 4+)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Mozilla Firefox (version 3.5+)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Safari (version 4+)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Microsoft Edge (toutes versions)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Opera (version 10.5+)</span>
          </li>
        </ul>
      </div>
      <p className="text-sm text-purple-400">
        Veuillez mettre à jour votre navigateur ou utiliser l&apos;un des
        navigateurs ci-dessus.
      </p>
    </div>
  )
}
