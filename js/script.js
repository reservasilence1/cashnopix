document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splash-screen");
  const pageBackground = document.getElementById("pageBackground");
  const startButton = document.getElementById("startButton");

  // ===== CONFIG =====
  const splashDuration = 3000; // 3s
  const urlDestinoBack = "../back1";

  // Detecta se está na página /avaliar (pra não causar “pisca e volta”)
  const isAvaliar =
    window.location.pathname.includes("/avaliar") ||
    /\/avaliar\/index\.html$/i.test(window.location.pathname);

  // ===== 1) Splash -> Modal =====
  const showModal = () => {
    if (splashScreen) splashScreen.style.display = "none";
    if (pageBackground) pageBackground.classList.remove("modal-hidden");
  };

  // Se splash/modal não existirem (ex.: página /avaliar), não tenta rodar splash
  if (splashScreen && pageBackground) {
    setTimeout(() => {
      splashScreen.classList.add("fade-out");

      // Se não houver transição no CSS, transitionend pode não acontecer.
      // Então usamos fallback para garantir que o modal apareça.
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        showModal();
      };

      splashScreen.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 700); // fallback

    }, splashDuration);
  } else {
    // Não existe splash nesta página, garante que o conteúdo visível não fique travado
    if (splashScreen) splashScreen.style.display = "none";
    if (pageBackground) pageBackground.classList.remove("modal-hidden");
  }

  // ===== 2) Botão Começar -> /avaliar/index.html mantendo UTM =====
  if (startButton) {
    startButton.addEventListener("click", () => {
      // Aponta “certeiro” pro novo avaliar (evita rota cair no antigo)
      const next = new URL("/avaliar/index.html", window.location.origin);

      // Prioriza helper de UTM (se existir), senão usa query atual
      const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
      if (qs) next.search = qs;

      window.location.href = next.toString();
    });
  }

  // ===== 3) Prender histórico (SÓ FORA DO /avaliar) =====
  // Evita que a página de avaliar “pisque” e seja redirecionada por anti-back
  if (!isAvaliar) {
    // Estratégia simples: cria um state e, quando usuário tenta voltar, redireciona.
    history.replaceState({ locked: true }, "", location.href);

    // cria “entrada fantasma”
    history.pushState({ locked: true, ghost: true }, "", location.href);

    window.addEventListener("popstate", () => {
      window.location.replace(urlDestinoBack);
    });
  }
});
