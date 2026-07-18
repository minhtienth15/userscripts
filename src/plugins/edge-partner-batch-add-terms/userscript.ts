const MAX_TERMS = 7
const MAX_CHARS = 30
const MAX_WORDS = 21
const BATCH_BTN_ID = '__batch_add_btn__'

function createBatchButton(addTermBtn: HTMLButtonElement) {
  if (document.getElementById(BATCH_BTN_ID)) return

  const btn = addTermBtn.cloneNode(true) as HTMLButtonElement
  btn.id = BATCH_BTN_ID
  btn.disabled = false
  const label = btn.querySelector('span') || btn
  label.textContent = 'Batch Add'
  btn.style.marginLeft = '8px'
  btn.title = 'Add multiple search terms separated by commas'

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    showBatchDialog()
  })

  addTermBtn.parentElement!.insertBefore(btn, addTermBtn.nextSibling)
}

function parseTerms(raw: string) {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function validate(terms: string[]) {
  const errors: string[] = []

  if (terms.length > MAX_TERMS) {
    errors.push(`Too many terms: ${terms.length} (max ${MAX_TERMS})`)
  }

  const totalWords = terms.reduce((sum, t) => sum + t.split(/\s+/).length, 0)
  if (totalWords > MAX_WORDS) {
    errors.push(`Total words: ${totalWords} (max ${MAX_WORDS})`)
  }

  const longTerms = terms.filter((t) => t.length > MAX_CHARS)
  if (longTerms.length) {
    errors.push(`Terms exceeding ${MAX_CHARS} chars: ${longTerms.map((t) => `"${t}" (${t.length})`).join(', ')}`)
  }

  return { errors, totalWords }
}

function renderValidation(terms: string[], statusEl: HTMLElement, submitBtn: HTMLButtonElement) {
  if (!terms.length) {
    statusEl.innerHTML = ''
    submitBtn.disabled = true
    return
  }

  const { errors, totalWords } = validate(terms)

  const lines: string[] = []
  lines.push(`<span style="color:#605e5c;">${terms.length} term(s), ${totalWords} word(s)</span>`)
  for (const e of errors) {
    lines.push(`<span style="color:#a4262c;">✗ ${e}</span>`)
  }

  statusEl.innerHTML = lines.join('<br>')
  submitBtn.disabled = errors.length > 0
}

function showBatchDialog() {
  const overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.4)',
    zIndex: '100000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const dialog = document.createElement('div')
  Object.assign(dialog.style, {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    width: '480px',
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    fontFamily: 'Segoe UI, sans-serif',
  })

  dialog.innerHTML = `
    <h3 style="margin:0 0 12px;font-size:16px;color:#323130;">Batch Add Search Terms</h3>
    <p style="margin:0 0 8px;font-size:13px;color:#605e5c;">
      Enter search terms separated by commas.<br>
      Limits: max ${MAX_TERMS} terms, ${MAX_CHARS} chars/term, ${MAX_WORDS} total words.
    </p>
    <textarea id="__batch_terms__" rows="4" placeholder="term1, term2, term3, ..."
      style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #8a8886;border-radius:4px;font-size:14px;resize:vertical;font-family:inherit;"></textarea>
    <div id="__batch_validation__" style="margin-top:6px;font-size:12px;line-height:1.6;min-height:20px;"></div>
    <div id="__batch_progress__" style="font-size:13px;color:#605e5c;min-height:20px;"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
      <button id="__batch_cancel__" style="padding:6px 20px;border:1px solid #8a8886;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;">Cancel</button>
      <button id="__batch_submit__" disabled style="padding:6px 20px;border:none;border-radius:4px;background:#0078d4;color:#fff;cursor:pointer;font-size:14px;">Add All</button>
    </div>
  `

  overlay.appendChild(dialog)
  document.body.appendChild(overlay)

  const textarea = document.getElementById('__batch_terms__') as HTMLTextAreaElement
  const validationEl = document.getElementById('__batch_validation__')!
  const progressEl = document.getElementById('__batch_progress__')!
  const cancelBtn = document.getElementById('__batch_cancel__') as HTMLButtonElement
  const submitBtn = document.getElementById('__batch_submit__') as HTMLButtonElement

  textarea.focus()

  textarea.addEventListener('input', () => {
    const terms = parseTerms(textarea.value)
    renderValidation(terms, validationEl, submitBtn)
  })

  const close = () => overlay.remove()
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
  cancelBtn.addEventListener('click', close)

  submitBtn.addEventListener('click', async () => {
    const terms = parseTerms(textarea.value)
    if (!terms.length) return

    submitBtn.disabled = true
    textarea.disabled = true
    cancelBtn.disabled = true

    const input = findTermInput()
    if (!input) {
      progressEl.textContent = 'Could not find the search term input field.'
      progressEl.style.color = '#a4262c'
      submitBtn.disabled = false
      textarea.disabled = false
      cancelBtn.disabled = false
      return
    }

    let added = 0
    for (const term of terms) {
      progressEl.textContent = `Adding "${term}" (${added + 1}/${terms.length})...`

      const currentInput = findTermInput()
      if (!currentInput) break

      setNativeValue(currentInput, term)
      currentInput.dispatchEvent(new Event('input', { bubbles: true }))
      currentInput.dispatchEvent(new Event('change', { bubbles: true }))

      await waitFor(() => {
        const btn = findAddTermBtn()
        return btn !== null && !btn.disabled
      }, 2000)

      const currentBtn = findAddTermBtn()
      if (currentBtn) currentBtn.click()
      added++

      await waitFor(() => {
        const inp = findTermInput()
        return inp !== null && inp.value === ''
      }, 2000)
    }

    close()
  })
}

function findTermInput() {
  return document.getElementById('last-search-item') as HTMLInputElement | null
}

function findAddTermBtn() {
  const btns = document.querySelectorAll('button')
  for (const btn of btns) {
    if (btn.id === BATCH_BTN_ID) continue
    const text = btn.textContent?.trim()
    if (text === 'Add Term' || text === 'Add term') return btn
  }
  return null
}

function waitFor(predicate: () => boolean, timeout = 2000) {
  return new Promise<void>((resolve) => {
    if (predicate()) return resolve()
    const interval = setInterval(() => {
      if (predicate()) {
        clearInterval(interval)
        resolve()
      }
    }, 50)
    setTimeout(() => {
      clearInterval(interval)
      resolve()
    }, timeout)
  })
}

function setNativeValue(el: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(el)
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) {
    setter.call(el, value)
  } else {
    el.value = value
  }
}

const observer = new MutationObserver(() => {
  const buttons = document.querySelectorAll('button')
  for (const btn of buttons) {
    const text = btn.textContent?.trim()
    if (text === 'Add Term' || text === 'Add term') {
      createBatchButton(btn as HTMLButtonElement)
    }
  }
})

observer.observe(document.body, { childList: true, subtree: true })
