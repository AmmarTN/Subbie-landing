/* Shared across every page. Every lookup is guarded: pages like /download/ or /privacy/
   have no feature tabs and no hamburger, and an unguarded throw here used to abort the
   rest of the file. */

// ---------- Mobile navigation ----------
(() => {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '×' : '☰';
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) setOpen(false);
  });
})();

// ---------- Feature tabs (ARIA tablist with roving tabindex) ----------
(() => {
  const tabs = [...document.querySelectorAll('.feature-tab')];
  if (!tabs.length) return;

  const panelFor = (tab) => document.getElementById(tab.dataset.scene);

  const select = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      const panel = panelFor(t);
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('tabindex', on ? '0' : '-1');
      if (panel) panel.classList.toggle('active', on);
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    const panel = panelFor(tab);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', (tab.id ||= `feature-tab-${i + 1}`));
      tab.setAttribute('aria-controls', panel.id);
    }
    tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');

    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (dir) {
        e.preventDefault();
        select(tabs[(i + dir + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home') {
        e.preventDefault(); select(tabs[0], true);
      } else if (e.key === 'End') {
        e.preventDefault(); select(tabs[tabs.length - 1], true);
      }
    });
  });
})();

// ---------- FAQ disclosure ----------
(() => {
  const buttons = document.querySelectorAll('.faq-question');
  if (!buttons.length) return;
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
    });
  });
})();

// ---------- Download-intent measurement ----------
/* One delegated listener. The download CTA appears in several places and the nav copy is
   hidden below 760px, so `location` is what tells you which CTA actually converts.
   Fires into whichever analytics provider is present; silent no-op if none is. */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-analytics]');
  if (!el) return;
  const name = el.dataset.analytics;
  const props = { location: el.dataset.analyticsLocation || 'unknown' };
  try {
    if (typeof window.va === 'function') window.va('event', { name, ...props });
    else if (typeof window.plausible === 'function') window.plausible(name, { props });
  } catch (_) { /* measurement must never break the download */ }
}, { capture: true });
