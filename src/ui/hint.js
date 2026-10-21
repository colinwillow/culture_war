// Briefly flashes a big icon at the top of the screen (e.g. "drag" while placing).
import { svg } from './icons.js?v=119';

let el = null, t = null;
export function showHint(icon) {
  if (!el) { el = document.createElement('div'); el.id = 'hint'; document.body.appendChild(el); }
  el.innerHTML = svg(icon);
  el.classList.add('show');
  clearTimeout(t);
  t = setTimeout(() => el.classList.remove('show'), 1800);
}
