// Apply the saved choice before the page paints; white is the first-visit default.
(() => {
  let dark = false;
  try { dark = localStorage.getItem('wepa-theme') === 'dark'; } catch {}
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.getElementById('lightTheme').media = dark ? 'not all' : 'all';
})();
