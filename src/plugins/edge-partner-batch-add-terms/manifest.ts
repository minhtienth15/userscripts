import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Edge Partner Center - Batch Add Search Terms',
    namespace: 'https://rxliuli.com',
    description: 'Add a "Batch Add" button next to "Add Term" to bulk-add comma-separated search terms',
    match: ['https://partner.microsoft.com/en-us/dashboard/microsoftedge/*/listings*'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
