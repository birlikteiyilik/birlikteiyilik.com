export function AcademyHeader() {
  return (
    <header className="academy-header">
      <a className="academy-brand" href="/" aria-label="Birlikte İyilik Akademi ana sayfası">
        <img src="/images/favicon-square.png" alt="" width="42" height="42" />
        <div><strong>Birlikte İyilik</strong><span>AKADEMİ</span></div>
      </a>
      <span className="academy-header-note">Öğretmen kaynakları</span>
    </header>
  );
}
