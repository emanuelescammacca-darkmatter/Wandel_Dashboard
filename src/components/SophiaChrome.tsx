import wandelLogo from '../assets/wandel-logo.png';
import waveBg from '../assets/wave.png';

// Decorative wave anchored to the bottom of a dark-blue screen. Render as the first child of a
// `relative isolate overflow-hidden` container; it sits at z-[-1] so content paints above it.
export function WaveBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[-1] bg-no-repeat bg-bottom"
      style={{
        backgroundImage: `url(${waveBg})`,
        backgroundSize: '100% auto',
        height: '100%',
        mixBlendMode: 'screen',
      }}
    />
  );
}

/**
 * Shared visual chrome for the dark chatbot screens (Ask Sophia + New Position),
 * so both stay pixel-identical.
 */

// Large, faint, centred white Wandel mark used as a background watermark. Crops out the
// "WANDEL" wordmark and shows only the geometric glyph (measured bbox 327×326 at 90,52 in
// the 500×500 source), scaled up so it sits cleanly behind the chat content.
export function LogoWatermark({ opacity = 0.05, size = 460 }: { opacity?: number; size?: number }) {
  const scale = size / 327; // source glyph is 327px wide
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
    >
      <span
        className="block"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${wandelLogo})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${(500 * scale).toFixed(1)}px ${(500 * scale).toFixed(1)}px`,
          backgroundPosition: `${(-90 * scale).toFixed(1)}px ${(-52 * scale).toFixed(1)}px`,
          filter: 'brightness(0) invert(1)',
          opacity,
        }}
      />
    </div>
  );
}

// White Wandel logo inside the gradient-bordered dark box, shown above the chatbot title.
// `size` is the outer dark box edge in px (default 48); the inner glyph/background scale
// proportionally off the original 48/30/43.35 ratios so it stays crisp at any size.
export function WandelBadge({ className = '', size = 48 }: { className?: string; size?: number }) {
  const glyph = size * (30 / 48);
  const bg = size * (43.35 / 48);
  const bgX = size * (-6.9 / 48);
  const bgY = size * (-3.6 / 48);
  const radius = size >= 40 ? 'rounded-xl' : 'rounded-lg';
  return (
    <div
      className={`p-[2px] ${radius} bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-300 shrink-0 shadow-[0_0_22px_rgba(129,140,248,0.4)] ${className}`}
    >
      <div
        className={`${radius} bg-[#0c1330] flex items-center justify-center`}
        style={{ width: size, height: size }}
      >
        <span
          role="img"
          aria-label="Wandel"
          className="inline-block shrink-0"
          style={{
            width: glyph,
            height: glyph,
            backgroundImage: `url(${wandelLogo})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${bg.toFixed(2)}px ${bg.toFixed(2)}px`,
            backgroundPosition: `${bgX.toFixed(2)}px ${bgY.toFixed(2)}px`,
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>
    </div>
  );
}

// Compact white Wandel glyph for inline chat replies, drawn as inline SVG strokes so each line
// can animate independently. When `animated`, every stroke shortens then elongates back
// (a "drawing"/breathing effect, staggered), signalling that Sophia is "generating". The glow
// is constant. Each line is normalized with pathLength={1} so `stroke-dashoffset` (0 → 0.5 → 0)
// retracts and regrows it regardless of its real length.
export function SophiaThinkingMark({
  size = 22,
  animated = false,
}: {
  size?: number;
  animated?: boolean;
}) {
  const cls = animated ? 'sophia-draw-line' : '';
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        role="img"
        aria-label="Wandel"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        stroke="#fff"
        strokeWidth={19}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 5px rgba(129,140,248,0.7))', overflow: 'visible' }}
      >
        {/* Geometry traced from wandel-logo.png (normalized to a 100×100 box). */}
        {/* L1 — long main diagonal (top-left → bottom-right) */}
        <line x1="10" y1="10" x2="90" y2="90.6" pathLength={1} strokeDasharray={1} className={cls} style={{ animationDelay: '0s' }} />
        {/* L2 — shorter parallel diagonal, offset upper-right */}
        <line x1="48.2" y1="9.8" x2="90.3" y2="52" pathLength={1} strokeDasharray={1} className={cls} style={{ animationDelay: '.12s' }} />
        {/* L3 — dot (very short parallel stroke), far upper-right */}
        <line x1="86.5" y1="9.4" x2="90.7" y2="13.7" pathLength={1} strokeDasharray={1} className={cls} style={{ animationDelay: '.24s' }} />
        {/* L4 — chevron on the lower-left; upper arm parallel to the diagonals (45°) and
            equally spaced (−27.3 offset), lower arm ~perpendicular so it still reads as an arrow */}
        <polyline points="9.6,48.4 33.5,71.9 9.4,90.3" pathLength={1} strokeDasharray={1} className={cls} style={{ animationDelay: '.36s' }} />
      </svg>
    </span>
  );
}

// Single chat bubble shared by every Sophia chat view (Ask Sophia, New Position, …) so the
// styling and streaming treatment stay identical. User messages are white pointy-cornered
// bubbles; assistant messages are plain white text led by the animated thinking mark, with a
// blinking caret while `streaming`.
export function ChatMessage({
  role,
  text,
  streaming,
}: {
  role: 'user' | 'assistant';
  text: string;
  streaming: boolean;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-sm whitespace-pre-wrap break-words text-gray-800 shadow-sm">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start items-start gap-2.5">
      <span className="mt-0.5">
        <SophiaThinkingMark size={22} animated={streaming} />
      </span>
      <div className="max-w-[80%] pt-px text-sm whitespace-pre-wrap break-words text-white">
        {text}
        {streaming && <span className="sophia-caret" />}
      </div>
    </div>
  );
}

// Shared hover treatment for the chatbot category/setup cards: lift + slight scale + glow.
export const CHATBOT_CARD_HOVER =
  'transition-all duration-200 hover:-translate-y-[3px] hover:scale-[1.03] hover:border-indigo-400/70 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18),0_0_24px_rgba(129,140,248,0.55)]';

// Shared focus glow for the chatbot composer box.
export const CHATBOT_COMPOSER_GLOW =
  'transition-all duration-200 focus-within:border-indigo-400/70 focus-within:shadow-[0_0_0_4px_rgba(129,140,248,0.35),0_0_28px_rgba(129,140,248,0.6)]';
