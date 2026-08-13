// OpticsKit PV tracker
(function() {
  var p = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  if (p === '/admin') return; // don't track admin page
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: p })
  }).catch(function() {});
})();
