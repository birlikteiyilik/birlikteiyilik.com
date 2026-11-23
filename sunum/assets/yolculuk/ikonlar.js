(function () {
  'use strict';
  var paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    book: '<path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2Z"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    bookmark: '<path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z"/>',
    shapes: '<circle cx="7" cy="7" r="4"/><path d="M14 13h7v8h-7zM4 21l4-7 4 7ZM15 3l6 6m0-6-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    archive: '<path d="M4 8h16v12H4zM3 3h18v5H3zm6 9h6"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3ZM17 4a3 3 0 0 1 0 6m1 4a4 4 0 0 1 3 4v2"/>',
    exit: '<path d="M10 4H4v16h6m4-13 5 5-5 5m-6-5h11"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m6 0h2m-10 4h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    reading: '<path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3"/>',
    play: '<path d="M8 5.5a1 1 0 0 1 1.5-.9l10 6.5a1 1 0 0 1 0 1.8l-10 6.5a1 1 0 0 1-1.5-.9Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
    unlock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 7.5-2m-3.5 9v3"/>',
    checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    pencil: '<path d="m15 4 5 5M4 20l4.5-1 11-11a3.2 3.2 0 0 0-4.5-4.5l-11 11Z"/>',
    board: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m8 21 2-4m4 0 2 4M7 12l3-3 3 2 4-4"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 5-3v10l-5-3"/>',
    route: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/>',
    shield: '<path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6Zm-4 9 3 3 5-6"/>',
    chevrondown: '<path d="m5 9 7 7 7-7"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    leaf: '<path d="M5 19c-6-8 2-16 15-15 1 13-7 21-15 15Zm0 0L16 8m-7 7v-4m0 4h4"/>',
    map: '<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Zm0 0v14m6-12v14"/>',
    cards: '<rect x="7" y="3" width="13" height="16" rx="2.5"/><path d="M4 7v11a3 3 0 0 0 3 3h9"/><path d="m13.5 8 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3Z"/>',
    library: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 5.2l3.7-1 3.3 15.5-3.8 1z"/>',
    star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    sparkles: '<path d="m10 4 1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8ZM18 3l.6 1.4L20 5l-1.4.6L18 7l-.6-1.4L16 5l1.4-.6Z"/>',
    heart: '<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11Z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
    live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4m8.4 0a6 6 0 0 1 0 8.4M5 19a10 10 0 0 1 0-14m14 0a10 10 0 0 1 0 14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 13H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 2.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20.4 9H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 2Z"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8Zm0 0c2-4 6-4 6-1.5S14 8 12 8Z"/>',
    group: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h2a4.5 4.5 0 0 1 4.5 4.5V20M13 14.3A4.5 4.5 0 0 1 15 14h2a4.5 4.5 0 0 1 4.5 4.5V20"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'
  };
  window.BiriIcons = function (root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (node) {
      var path = paths[node.dataset.icon];
      if (path) node.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + '</svg>';
    });
  };
})();
