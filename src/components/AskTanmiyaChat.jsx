import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChatAnswerBody from './ChatAnswerBody';
import BrandLogo from './BrandLogo';
import IconButton from './IconButton';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { askTanmiyaRag } from '../services/rag';
import { canUseLiveGemini } from '../services/gemini';
import {
  clearChatMessages,
  loadChatMessages,
  saveChatMessages,
} from '../utils/experienceStorage';

const SUGGESTION_KEYS = [
  'ragSuggestOuzoud',
  'ragSuggestTrip',
  'ragSuggestArtisan',
  'ragSuggestHow',
];

/**
 * Floating RAG chat — grounded answers about places, trips, artisans, and the app.
 */
export default function AskTanmiyaChat() {
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();
  const liveAi = canUseLiveGemini(isAdmin);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(loadChatMessages);
  const bottomRef = useRef(null);

  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(question) {
    const q = String(question || input).trim();
    if (!q || busy) return;

    setError(null);
    setInput('');
    const nextHistory = [...messages, { role: 'user', text: q }];
    setMessages(nextHistory);
    setBusy(true);

    try {
      const result = await askTanmiyaRag(q, {
        lang,
        history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        liveAi,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.answer,
          sources: result.sources,
          media: result.media,
          followUps: result.followUps,
          usedEmbeddings: result.usedEmbeddings,
        },
      ]);
    } catch (err) {
      setError(err?.message || t('ragFail'));
      setMessages((prev) => prev.slice(0, -1));
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 end-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-xl shadow-tertiary/30 transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:end-8"
        aria-expanded={open}
        aria-controls="ask-tadla-panel"
        title={t('ragTitle')}
      >
        {open ? (
          <span className="material-symbols-outlined text-[28px]">close</span>
        ) : (
          <BrandLogo variant="icon" size="sm" className="h-8 brightness-0 invert" />
        )}
      </button>

      {open && (
        <div
          id="ask-tadla-panel"
          className="fixed bottom-[10.5rem] end-4 z-[60] flex h-[min(68vh,540px)] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface shadow-2xl md:bottom-28 md:end-8"
          role="dialog"
          aria-label={t('ragTitle')}
        >
          <header className="flex items-start justify-between gap-3 border-b border-outline-variant/20 bg-primary px-4 py-3 text-on-primary">
            <div className="flex items-start gap-3">
              <BrandLogo
                variant="icon"
                size="sm"
                className="mt-0.5 h-9 rounded-lg bg-white/15 p-1 brightness-0 invert"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-fixed">
                  {t('ragCompanion')}
                </p>
                <h2 className="font-headline text-lg font-bold">{t('ragTitle')}</h2>
                <p className="mt-0.5 text-xs text-primary-fixed/90">{t('ragSubtitle')}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  title={t('clearChat')}
                  aria-label={t('clearChat')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                  onClick={() => {
                    clearChatMessages();
                    setMessages([]);
                    setError(null);
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                </button>
              )}
              <Link
                to="/ask"
                title={t('ragExpand')}
                aria-label={t('ragExpand')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">open_in_full</span>
              </Link>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-surface-container-low/40 px-3 py-3">
            {messages.length === 0 && (
              <div className="space-y-3 p-1">
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {t('ragWelcomeHuman')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      disabled={busy}
                      onClick={() => send(t(key))}
                      className="rounded-full border border-outline-variant/30 bg-white px-3 py-1.5 text-start text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-tertiary text-on-tertiary'
                      : 'border border-outline-variant/15 bg-white text-on-surface shadow-sm'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  ) : (
                    <ChatAnswerBody
                      text={m.text}
                      media={m.media}
                      followUps={m.followUps}
                      sources={m.sources}
                      usedEmbeddings={m.usedEmbeddings}
                      onFollowUp={send}
                      onNavigate={() => setOpen(false)}
                      compact
                    />
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined animate-pulse text-base text-tertiary">
                  edit_note
                </span>
                {t('ragThinkingHuman')}
              </p>
            )}
            {error && (
              <p className="rounded-xl bg-error-container/40 px-3 py-2 text-xs text-on-error-container">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-outline-variant/20 bg-surface p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ragPlaceholder')}
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tertiary/30 disabled:opacity-60"
            />
            <IconButton
              type="submit"
              icon="send"
              label={t('ragSend')}
              variant="primary"
              className="bg-tertiary text-on-tertiary hover:bg-tertiary hover:text-on-tertiary"
              disabled={busy || !input.trim()}
            />
          </form>
        </div>
      )}
    </>
  );
}
