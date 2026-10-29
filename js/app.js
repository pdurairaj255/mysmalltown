// My Small Town — shared behavior: offline support and the bottom tab bar.
// A page opts in to the tab bar with <nav class="tabbar" data-current="home"></nav>.

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

const TABS = [
  {
    id: 'home', label: 'Home', href: 'index.html',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="tab-fill" d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>'
  },
  {
    id: 'share', label: 'Share', href: 'share.html',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>'
  },
  {
    id: 'town', label: 'Town', href: 'town.html',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="tab-fill" d="M2 21V12l5-4 5 4v9z"/><path class="tab-fill" d="M12 21v-8h9v8z"/><path d="M2 21h20"/></svg>'
  },
  {
    id: 'recap', label: 'Recap', href: 'recap.html',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect class="tab-fill" x="2" y="5" width="9" height="14" rx="2"/><rect class="tab-fill" x="13" y="5" width="9" height="14" rx="2"/></svg>'
  },
  {
    id: 'stats', label: 'Stats', href: 'stats.html',
    icon: '<svg class="tab-bold" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 20V12M12 20V5M19 20v-9"/></svg>'
  },
  {
    id: 'groups', label: 'Groups', href: 'groups.html',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="tab-fill" cx="9" cy="8" r="3.5"/><path class="tab-fill" d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/></svg>'
  }
];

document.querySelectorAll('nav.tabbar').forEach((nav) => {
  const current = nav.dataset.current;
  nav.setAttribute('aria-label', 'Main');
  nav.innerHTML = TABS.map((t) =>
    `<a href="${t.href}"${t.id === current ? ' aria-current="page"' : ''}>${t.icon}${t.label}</a>`
  ).join('');
});
