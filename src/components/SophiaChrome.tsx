import wandelLogo from '../assets/wandel-logo.png';

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
export function WandelBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={`p-[2px] rounded-xl bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-300 shrink-0 shadow-[0_0_22px_rgba(129,140,248,0.4)] ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#0c1330] flex items-center justify-center">
        <span
          role="img"
          aria-label="Wandel"
          className="inline-block shrink-0"
          style={{
            width: 30,
            height: 30,
            backgroundImage: `url(${wandelLogo})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '43.35px 43.35px',
            backgroundPosition: '-6.9px -3.6px',
            filter: 'brightness(0) invert(1)',
          }}
        />
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
