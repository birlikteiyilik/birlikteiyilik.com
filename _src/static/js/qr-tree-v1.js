// Progressive enhancement: the real, downloadable QR and destination work without WebGL.
const trees = document.querySelectorAll('[data-goodness-tree]');
let engine;
const load = (root) => {
  if (root.dataset.treeLoaded) return;
  root.dataset.treeLoaded = 'true';
  engine ||= import('./qr-tree-scene-v1.js');
  engine.then(({ enhanceTree }) => enhanceTree(root)).catch(() => {
    root.dataset.view = 'qr';
  });
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      load(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '120px' });
  trees.forEach((root) => observer.observe(root));
} else trees.forEach(load);
