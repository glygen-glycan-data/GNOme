if (window.document.location.toString().includes("gnome.glyomics.org")) {
  const script = window.document.createElement('script');
  window.document.head.appendChild(script);
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-47WSZ1WYRZ';
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-47WSZ1WYRZ");
}
