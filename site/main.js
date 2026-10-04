// The page's small behaviours: the two audience tabs, copy buttons and
// code highlighting.
import { highlightAll } from './highlight.js';

highlightAll();

// Two audiences, two tabs; #agents in the URL opens the second one.
const tabs = [...document.querySelectorAll('[role="tab"]')];

const select = (id) =>
  tabs.forEach((tab) => {
    const on = tab.getAttribute('aria-controls') === id;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
  });

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    const id = tab.getAttribute('aria-controls');
    history.replaceState(null, '', id === 'agents' ? '#agents' : location.pathname);
    select(id);
  });
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.click();
    next.focus();
  });
});

// A link into the humans tab (#games) opens it first, then scrolls there.
const fromHash = () => {
  const hash = location.hash.slice(1);
  select(hash === 'agents' ? 'agents' : 'humans');
  if (hash && hash !== 'agents') document.getElementById(hash)?.scrollIntoView();
};
window.addEventListener('hashchange', fromHash);
fromHash();

document.querySelectorAll('.copy').forEach((button) => {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    const text = button.dataset.copy ?? document.querySelector(button.dataset.copyFrom).textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }
    setTimeout(() => (button.textContent = label), 1500);
  });
});
