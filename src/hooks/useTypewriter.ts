import { useEffect, useRef, useState } from 'react';

/**
 * Drives a per-character "generating" reveal for chat replies. Only one message
 * streams at a time. Shared by every Sophia chat view so the behaviour stays in
 * sync across them.
 *
 * Usage: call `start(assistantMessageId, fullText)` right after appending the
 * assistant message, then render `displayText(m)` and gate animations on
 * `isStreaming(m.id)`.
 */
export function useTypewriter(speedMs = 28) {
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(0);
  const textRef = useRef(''); // full text of the streaming message (kept out of effect deps)

  useEffect(() => {
    if (streamingId === null) return;
    const full = textRef.current.length;
    const id = setInterval(() => {
      setRevealed((n) => {
        const next = n + 1;
        if (next >= full) {
          clearInterval(id);
          setStreamingId(null);
          return full;
        }
        return next;
      });
    }, speedMs);
    return () => clearInterval(id);
  }, [streamingId, speedMs]);

  const start = (id: number, text: string) => {
    textRef.current = text;
    setRevealed(0);
    setStreamingId(id);
  };

  const isStreaming = (id: number) => id === streamingId;

  const displayText = (m: { id: number; text: string }) =>
    m.id === streamingId ? m.text.slice(0, revealed) : m.text;

  return { streamingId, revealed, start, isStreaming, displayText };
}
