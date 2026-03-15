/* =============================================
   Medical Education Site — Shared JS
   ============================================= */

// Navigation structure
// Resolve base path so nav links work both on GitHub Pages (/Medical-Education/)
// and on a local dev server (/).
const _base = (() => {
  const parts = window.location.pathname.split('/');
  const docsIdx = parts.indexOf('docs');
  if (docsIdx !== -1) return parts.slice(0, docsIdx).join('/') + '/docs';
  // fallback: assume served from repo root
  return '/docs';
})();

const NAV = [
  {
    section: 'Getting Started',
    items: [
      { label: 'Introduction',    href: `${_base}/index.html`,      icon: '◎' },
      { label: 'Library Wiki',    href: `${_base}/wiki/index.html`, icon: '📖' },
    ]
  },
  {
    section: 'Physiology',
    items: [
      { label: 'Cardiac Cycle',     href: `${_base}/physiology/heart-beat.html`,      icon: '♥' },
      { label: 'Breathing',         href: `${_base}/physiology/breathing.html`,        icon: '🫁' },
      { label: 'Blood Flow',           href: `${_base}/physiology/blood-flow.html`,          icon: '⟳' },
      { label: 'Vascular Resistance', href: `${_base}/physiology/vascular-resistance.html`, icon: '🫀' },
      { label: 'Action Potential',    href: `${_base}/physiology/action-potential.html`,    icon: '⚡' },
    ]
  },
  {
    section: 'Pharmacology',
    items: [
      { label: 'Drug Absorption',    href: `${_base}/pharmacology/drug-absorption.html`,  icon: '◈' },
      { label: 'Pharmacokinetics',   href: `${_base}/pharmacology/pharmacokinetics.html`, icon: '≈' },
    ]
  }
];

function buildSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const current = window.location.pathname;
  let html = '';

  NAV.forEach((group, i) => {
    if (i > 0) html += '<div class="sidebar-divider"></div>';
    html += `<div class="sidebar-section">
      <span class="sidebar-section-title">${group.section}</span>
      <ul>`;

    group.items.forEach(item => {
      // Match by pathname — strip trailing slash, handle both .html and no extension
      const isActive = current === item.href
        || current === item.href.replace('.html', '')
        || current === item.href.replace('/index.html', '/');

      html += `<li>
        <a href="${item.href}" class="${isActive ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      </li>`;
    });

    html += '</ul></div>';
  });

  sidebar.innerHTML = html;
}

function buildMobileToggle() {
  const hamburger = document.querySelector('.hamburger');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.querySelector('.sidebar-overlay');

  if (!hamburger || !sidebar) return;

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // Close on nav link click (mobile)
  sidebar.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    }
  });
}

// Anchor deep-link smooth scroll
function setupAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  buildMobileToggle();
  setupAnchors();
});
