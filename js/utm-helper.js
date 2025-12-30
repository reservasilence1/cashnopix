// UTM Helper: persistir e recuperar a query string com UTMs
(function(){
  function hasTrackingParam(searchParams){
    const keys = Array.from(searchParams.keys());
    return keys.some(k => /^utm_|^(gclid|fbclid|msclkid|yclid|twclid|sck|pk_campaign)$/.test(k));
  }

  // Salva UTMs na sessão (se existirem na URL atual)
  window.persistUTMs = function(){
    try{
      const sp = new URLSearchParams(window.location.search);
      if (hasTrackingParam(sp)){
        // Guarda a query inteira para reaproveitar depois
        sessionStorage.setItem('persisted_qs', window.location.search);
        // Também guarda chave/valor individual como fallback
        const obj = {};
        sp.forEach((v,k)=> obj[k]=v);
        sessionStorage.setItem('persisted_qs_obj', JSON.stringify(obj));
      }
    }catch(e){}
  };

  // Retorna uma query string com UTMs (ex.: "?utm_source=...&...")
  window.getUTMQS = function(){
    try{
      let qs = window.location.search;
      if (qs && /utm_/.test(qs)) return qs;
      const stored = sessionStorage.getItem('persisted_qs');
      if (stored) return stored;
      const objStr = sessionStorage.getItem('persisted_qs_obj');
      if (objStr){
        const obj = JSON.parse(objStr);
        const sp = new URLSearchParams(obj);
        const s = sp.toString();
        return s ? ("?" + s) : "";
      }
    }catch(e){}
    return "";
  };

  // Executa ao carregar a página
  try{ persistUTMs(); }catch(e){}
})();

    // ======================================================
    // Auto-append de UTMs em todos os links internos
    // ======================================================
    document.addEventListener('DOMContentLoaded', () => {
      const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
      if (!qs) return;
    
      document.querySelectorAll('a[href]').forEach(a => {
        try {
          const href = a.getAttribute('href');
          if (!href) return;
          const u = new URL(href, window.location.href);
          // Apenas links internos e que ainda não têm query
          if (u.origin === window.location.origin && !u.search) {
            u.search = qs;
            a.setAttribute('href', u.toString());
          }
        } catch(e) {}
      });
    });

