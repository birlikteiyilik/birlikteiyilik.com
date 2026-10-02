(function () {
  'use strict';
  function option(value, label) {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const provinces = Array.from(document.querySelectorAll('[data-province]'));
    if (!provinces.length) return;
    const districts = Array.from(document.querySelectorAll('[data-district]'));
    try {
      const response = await fetch('/data/turkey-locations.json');
      if (!response.ok) throw new Error('Konum listesi alınamadı.');
      const data = await response.json();
      const names = Object.keys(data).sort((a, b) => a.localeCompare(b, 'tr'));
      provinces.forEach((select) => {
        select.replaceChildren(option('', 'İl seçin'), ...names.map((name) => option(name, name)));
        select.addEventListener('change', () => {
          const district = select.form?.querySelector('[data-district]') || districts[provinces.indexOf(select)];
          if (!district) return;
          const list = data[select.value] || [];
          district.replaceChildren(option('', select.value ? 'İlçe seçin' : 'Önce il seçin'), ...list.map((name) => option(name, name)));
          district.disabled = !select.value;
          district.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    } catch (error) {
      provinces.forEach((select) => {
        select.replaceChildren(option('', 'Konum listesi yüklenemedi'));
        select.disabled = true;
      });
      districts.forEach((select) => { select.disabled = true; });
      console.error(error);
    }
  });
})();
