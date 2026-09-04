import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'YouTube Background Play',
    namespace: 'https://rxliuli.com',
    description: 'Keep YouTube playing in background',
    match: ['https://*.youtube.com/*'],
    'run-at': 'document-start',
    sandbox: 'DOM',
    grant: 'none',
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
