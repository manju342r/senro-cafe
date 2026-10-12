import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { askCafeRag, getChatStatus, SUGGESTED_PROMPTS } from '@/lib/rag/ask'
import type { ChatMessage } from '@/lib/rag/types'

const SESSION_KEY = 'mana-katha-chat-v1'

function uid() {
  return `msg-${crypto.randomUUID().slice(0, 8)}`
}

function loadSession(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function saveSession(messages: ChatMessage[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-40)))
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi — I’m the Maña Katha assistant. I use our menu, hours, and visit info (RAG) to answer. Ask about dishes, location, or ordering ahead.',
  createdAt: new Date().toISOString(),
  confidence: 'high',
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadSession()
    return saved.length ? saved : [WELCOME]
  })
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState(false)
  const [model, setModel] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  useEffect(() => {
    saveSession(messages)
  }, [messages])

  useEffect(() => {
    let cancelled = false
    void getChatStatus().then((s) => {
      if (cancelled) return
      setLive(s.live)
      setModel(s.model)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open, busy])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setBusy(true)

    try {
      const result = await askCafeRag(content)
      const assistant: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: result.answer,
        citations: result.citations,
        confidence: result.confidence,
        createdAt: new Date().toISOString(),
      }
      startTransition(() => {
        setMessages((m) => [...m, assistant])
      })
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          content: 'Something went wrong answering that. Please try again, or open Menu / Visit.',
          createdAt: new Date().toISOString(),
          confidence: 'low',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat-widget-dock pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          className="pointer-events-auto flex h-[min(32rem,calc(100svh-6.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden border border-line bg-ink/95 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          role="dialog"
          aria-label="Maña Katha café assistant"
        >
          <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="font-display text-xl font-semibold text-leaf">Café assistant</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-steam">
                {live
                  ? `Live AI · ${model ?? 'Gemini'}`
                  : 'Local RAG · add GEMINI_API_KEY for live AI'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost px-2 text-sm"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              Close
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-leaf text-ink'
                      : 'border border-line bg-forest/60 text-foam'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <li
                          key={c.id}
                          className="rounded-sm border border-line/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-steam"
                        >
                          {c.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {msg.role === 'assistant' && msg.confidence ? (
                    <p className="mt-1.5 text-[10px] uppercase tracking-wider text-steam/80">
                      Confidence · {msg.confidence}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {busy || pending ? (
              <p className="text-xs text-steam" aria-live="polite">
                Searching knowledge…
              </p>
            ) : null}
          </div>

          {messages.length <= 2 ? (
            <div className="flex flex-wrap gap-2 border-t border-line/60 px-3 py-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="chip chip-idle py-1.5 text-xs"
                  onClick={() => send(p)}
                  disabled={busy}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Message
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about menu, hours, location…"
                className="field py-2.5 text-sm"
                disabled={busy}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary shrink-0 px-4" disabled={busy || !input.trim()}>
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-steam">
              Answers cite café sources only ·{' '}
              <Link to="/menu" className="text-leaf hover:underline" onClick={() => setOpen(false)}>
                Menu
              </Link>
              {' · '}
              <Link to="/visit" className="text-leaf hover:underline" onClick={() => setOpen(false)}>
                Visit
              </Link>
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-widget-trigger pointer-events-auto btn btn-primary min-h-12 rounded-md px-4 shadow-[0_12px_30px_rgba(240,193,75,0.25)] sm:px-5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={undefined}
      >
        <span className="sm:hidden">{open ? 'Hide' : 'Ask'}</span>
        <span className="hidden sm:inline">{open ? 'Hide chat' : 'Ask Maña Katha'}</span>
      </button>
    </div>
  )
}
