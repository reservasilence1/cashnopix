document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splash-screen");
  const pageBackground = document.getElementById("pageBackground");
  const startButton = document.getElementById("startButton");

  // ===== CONFIG =====
  const splashDuration = 3000; // 3s
  const urlDestinoBack = "../back1";

  // ===== 1) Splash -> Modal =====
  const showModal = () => {
    if (splashScreen) splashScreen.style.display = "none";
    if (pageBackground) pageBackground.classList.remove("modal-hidden");
  };

  setTimeout(() => {
    if (!splashScreen) return showModal();

    splashScreen.classList.add("fade-out");

    // Se não houver transição no CSS, transitionend pode não acontecer.
    // Então usamos um fallback para garantir que o modal apareça.
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      showModal();
    };

    splashScreen.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 700); // fallback (ajuste se sua animação for maior/menor)

  }, splashDuration);

  // ===== 2) Botão Começar -> /avaliar mantendo UTM =====
  if (startButton) {
    startButton.addEventListener("click", () => {
      const next = new URL("/avaliar/index.html", window.location.origin);

      // prioriza helper de UTM (se existir), senão usa query atual
      const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
      if (qs) next.search = qs;

      window.location.href = next.toString();
    });
  }

  // ===== 3) Prender histórico (1x, sem duplicar listeners) =====
  // Estratégia simples: cria um state e, quando usuário tenta voltar, redireciona.
  // (SEM duplicar replaceState + pushState + 2 listeners)
  history.replaceState({ locked: true }, "", location.href);

  // cria “entrada fantasma”
  history.pushState({ locked: true, ghost: true }, "", location.href);

  window.addEventListener("popstate", (event) => {
    // qualquer tentativa de voltar -> manda pro destino
    window.location.replace(urlDestinoBack);
  });
});
