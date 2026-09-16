import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatAnswerBody from '../components/ChatAnswerBody';
import IconButton from '../components/IconButton';
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
 * Full-page RAG assistant for tourists.
 */
export default function AskPage() {
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();
  const liveAi = canUseLiveGemini(isAdmin);
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(loadChatMessages);
  const bottomRef = useRef(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (!q || bootstrapped.current) return;
    bootstrapped.current = true;
    setInput(q);
  }, [searchParams]);

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
    <section className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-3xl flex-col px-5 py-8 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
            {t('ragCompanion')}
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface md:text-4xl">
            {t('ragTitle')}
          </h1>
          <p className="max-w-xl text-on-surface-variant">{t('ragPageBodyHuman')}</p>
        </div>
        {messages.length > 0 && (
          <IconButton
            icon="delete_sweep"
            label={t('clearChat')}
            showLabel
            variant="ghost"
            onClick={() => {
              clearChatMessages();
              setMessages([]);
              setError(null);
            }}
          />
        )}
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={busy}
            onClick={() => send(t(key))}
            className="rounded-full border border-outline-variant/30 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {t(key)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {t('ragWelcomeHuman')}
            </p>
          )}
          {messages.map((m, i) => (
            <article
              key={`${m.role}-${i}`}
              className={`rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'ms-8 bg-tertiary text-on-tertiary'
                  : 'me-4 border border-outline-variant/15 bg-white'
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
                />
              )}
            </article>
          ))}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-pulse text-tertiary">
                edit_note
              </span>
              {t('ragThinkingHuman')}
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
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
          className="flex gap-2 border-t border-outline-variant/20 p-3 md:p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ragPlaceholder')}
            disabled={busy}
            className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-tertiary/30"
          />
          <IconButton
            type="submit"
            icon="send"
            label={t('ragSend')}
            variant="primary"
            size="lg"
            className="bg-tertiary text-on-tertiary hover:bg-tertiary hover:text-on-tertiary"
            disabled={busy || !input.trim()}
          />
        </form>
      </div>
    </section>
  );
}
