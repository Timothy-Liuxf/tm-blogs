document.addEventListener('DOMContentLoaded', () => {
  const layout = document.querySelector('.content-layout.has-sidebar');
  if (!layout) return;

  const sidebar = layout.querySelector('.sidebar');
  const openButton = layout.querySelector('.sidebar-open-button');
  const closeButton = layout.querySelector('.sidebar-close-button');
  const backdrop = layout.querySelector('.sidebar-backdrop');
  const narrowWindow = window.matchMedia('(max-width: 768px)');

  const setSidebarOpen = (isOpen, shouldMoveFocus = true) => {
    const isNarrow = narrowWindow.matches;

    layout.classList.toggle('sidebar-collapsed', !isNarrow && !isOpen);
    layout.classList.toggle('sidebar-mobile-open', isNarrow && isOpen);
    document.body.classList.toggle('sidebar-scroll-locked', isNarrow && isOpen);

    openButton.setAttribute('aria-expanded', String(isOpen));
    closeButton.setAttribute('aria-expanded', String(isOpen));
    sidebar.setAttribute('aria-hidden', String(!isOpen));

    if (shouldMoveFocus && isOpen) {
      closeButton.focus();
    } else if (shouldMoveFocus && !isOpen) {
      openButton.focus();
    }
  };

  openButton.addEventListener('click', () => setSidebarOpen(true));
  closeButton.addEventListener('click', () => setSidebarOpen(false));
  backdrop.addEventListener('click', () => setSidebarOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && layout.classList.contains('sidebar-mobile-open')) {
      setSidebarOpen(false);
    }
  });

  narrowWindow.addEventListener('change', (event) => {
    setSidebarOpen(!event.matches, false);
  });

  // Wide windows start expanded; narrow windows start closed.
  setSidebarOpen(!narrowWindow.matches, false);
});
