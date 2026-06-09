/* Soft pastel linear gradient (Figma "Eckig-Farbverlauf": #FFEB52 / #52F9FF / #5252FF / #FF00B8)
   at low opacity over white — cyan/green pushed to the top-left corner, pink centred.
   Single source of truth for the client-facing card fill, shared across the dashboard
   cards, candidate profiles, Ask Sophia, the position workspace and the new-position flow. */
export const CARD_GRADIENT =
  'linear-gradient(135deg, rgba(82,249,255,0.035) 0%, rgba(82,82,255,0.028) 26%, rgba(255,0,184,0.04) 52%, rgba(255,235,82,0.025) 100%), #ffffff';

/* Preview tint — a deliberately more saturated indigo/violet wash used when the
   New-Position flow is showing the assembled position as a *preview* (still editable),
   so the page reads visibly different from a normal editing surface. */
export const PREVIEW_GRADIENT =
  'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 55%, rgba(34,211,238,0.06) 100%), #ffffff';
