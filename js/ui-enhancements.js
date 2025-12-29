(() => {
  const splash = document.getElementById("splash-screen");
  const app = document.getElementById("app");

  const steps = {
    intro: document.getElementById("stepIntro"),
    code: document.getElementById("stepCode"),
    qr: document.getElementById("stepQrLoading"),
    rating: document.getElementById("stepRating"),
  };

  const progressFill = document.getElementById("progressFill");

  const startButton = document.getElementById("startButton");
  const codeInputsWrap = document.getElementById("codeInputs");
  const codeInputs = [...codeInputsWrap.querySelectorAll("input")];
  const btnConfirmCode = document.getElementById("btnConfirmCode");

  const overlay = document.getElementById("successOverlay");
  const confettiCanvas = document.getElementById("confettiCanvas");
  const successAmount = document.getElementById("successAmount");
  const successTitle = document.getElementById("successTitle");
  const successContinue = document.getElementById("successContinue");
  const moneySound = document.getElementById("moneySound");

  // ======= Navegação de etapas (API pública para seu script.js chamar) =======
  window.goToStep = function goToStep(name) {
    Object.values(steps).forEach(s => s.classList.remove("is-active"));
    steps[name]?.classList.add("is-active");
  };

  window.setProgress = function setProgress(pct) {
    progressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  // ======= Confete moderno (canvas) =======
  const ctx = confettiCanvas.getContext("2d");
  let confetti = [];
  let rafId = null;

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function burstConfetti() {
    confetti = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    // “canhões” nos lados
    const cannons = [
      { x: w * 0.15, y: h * 0.55, dir: 1 },
      { x: w * 0.85, y: h * 0.55, dir: -1 },
    ];

    const colors = [
      "#58b947", "#49b7a7", "#e4b93c", "#e25555",
      "#7c3aed", "#0ea5e9", "#f97316"
    ];

    cannons.forEach(c => {
      const count = 120;
      for (let i = 0; i < count; i++) {
        confetti.push({
          x: c.x,
          y: c.y,
          vx: rand(2.5, 8.5) * c.dir,
          vy: rand(-10, -3),
          g: rand(0.18, 0.32),
          size: rand(4, 8),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.2, 0.2),
          life: rand(52, 90),
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: Math.random() > 0.3 ? "rect" : "dot"
        });
      }
    });

    if (rafId) cancelAnimationFrame(rafId);
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 1.2, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    confetti = confetti.filter(p => p.life > 0 && p.y < window.innerHeight + 80);

    if (confetti.length > 0) {
      rafId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      rafId = null;
    }
  }

  // ======= Sucesso (API pública) =======
  window.triggerSuccess = function triggerSuccess({
    title = "Saldo atualizado!",
    amount = "49,67",
    playSound = false
  } = {}) {
    successTitle.textContent = title;
    successAmount.textContent = amount;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    burstConfetti();

    if (playSound) {
      try {
        moneySound.currentTime = 0;
        moneySound.play();
      } catch (e) {
        // em mobile, pode exigir interação prévia; sem erro visual
      }
    }
  };

  function closeSuccess() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  successContinue.addEventListener("click", () => {
    closeSuccess();
    // padrão: volta pra sequência. Você pode substituir no seu script.js.
    // Aqui deixei uma lógica simples: após sucesso -> loader QR -> avaliação.
    // Se você estiver em avaliação, você pode chamar goToStep("code") etc.
  });

  // ======= Input do código (auto-avanço + validação) =======
  function normalizeChar(ch) {
    return (ch || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function getTypedCode() {
    return codeInputs.map(i => normalizeChar(i.value)).join("");
  }

  function updateConfirmState() {
    const code = getTypedCode();
    btnConfirmCode.disabled = code.length !== 4;
  }

  codeInputs.forEach((inp, idx) => {
    inp.addEventListener("input", () => {
      inp.value = normalizeChar(inp.value).slice(0, 1);
      updateConfirmState();
      if (inp.value && idx < codeInputs.length - 1) {
        codeInputs[idx + 1].focus();
      }
      // autoconfirma ao completar 4
      if (getTypedCode().length === 4) {
        btnConfirmCode.click();
      }
    });

    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && idx > 0) {
        codeInputs[idx - 1].focus();
      }
    });
  });

  btnConfirmCode.addEventListener("click", () => {
    const code = getTypedCode();
    if (code.length !== 4) return;

    // 1) sucesso + confete (sem som aqui)
    window.triggerSuccess({ title: "Código confirmado!", amount: document.getElementById("valorAtual").textContent, playSound: false });

    // 2) após 900ms, fecha overlay e vai pro loader com QR (fundo branco, “mesma tela”)
    setTimeout(() => {
      overlay.classList.remove("is-open");
      window.goToStep("qr");
      window.setProgress(45);

      // 3) simula carregamento; ao terminar, vai para avaliação
      setTimeout(() => {
        window.goToStep("rating");
        window.setProgress(68);
      }, 1700);
    }, 900);
  });

  // ======= Avaliação (sucesso + SOM) =======
  document.querySelectorAll("[data-rate]").forEach(btn => {
    btn.addEventListener("click", () => {
      // sucesso + som de dinheiro
      window.triggerSuccess({ title: "Avaliação registrada!", amount: document.getElementById("valorAtual").textContent, playSound: true });

      // exemplo de sequência após avaliar:
      setTimeout(() => {
        overlay.classList.remove("is-open");
        window.goToStep("code");
        window.setProgress(85);

        // limpa inputs pra próximo código
        codeInputs.forEach(i => i.value = "");
        updateConfirmState();
        codeInputs[0].focus();
      }, 900);
    });
  });

  // ======= Boot =======
  function boot() {
    // some splash após pequena espera
    setTimeout(() => {
      splash.style.display = "none";
      app.classList.remove("modal-hidden");
      app.setAttribute("aria-hidden", "false");
      window.goToStep("intro");
      window.setProgress(18);
    }, 650);
  }

  startButton.addEventListener("click", () => {
    window.goToStep("code");
    window.setProgress(28);
    setTimeout(() => codeInputs[0].focus(), 80);
  });

  boot();
})();
