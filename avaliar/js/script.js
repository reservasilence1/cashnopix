/* =========================================================================
   cashnopix /avaliar/js/script.js (AJUSTADO)
   - Remove travamento no "PROCURANDO VALORES..."
   - Mantém o loading inicial (PROCURANDO VALORES PARA SAQUE)
   - Troca o “carregamento verde entre etapas” por QR loader branco (processingModal)
   - Sucesso moderno com confetes (se existir #successModal/#confettiCanvas) + fallback
   - Sucesso + som “money” ao votar (se existir áudio money), senão usa successSound
   - Remove DOMContentLoaded duplicado e prende histórico 1x (sem conflito)
======================================================================== */

/* =========================================================================
   VARIÁVEIS DE ESTADO E CONFIGURAÇÃO
======================================================================== */
let currentStage = 0;                 // 0..2
let currentSaldo = 50.00;

const qrConsultationDuration = 2500;  // tempo da “consulta QR” (modal branco)
const loadingDuration = 3000;         // tempo do loading inicial (PROCURANDO...)
const animationDuration = 900;        // duração do sucesso (overlay/modal)

let countdownInterval = null;
let initialTimeInSeconds = 140;
let timeRemaining = initialTimeInSeconds;

let isAudioUnlocked = false;

const funnelStages = [
  { name: "Avaliação 1", client: "Beatriz S.", cashback: 49.67, code: "LMNO", htmlId: "evaluation-0" },
  { name: "Avaliação 2", client: "João A.",   cashback: 44.67, code: "BCFG", htmlId: "evaluation-1" },
  { name: "Avaliação 3", client: "Camila B.", cashback: 57.75, code: "XYZA", htmlId: "evaluation-2" }
];

/* =========================================================================
   HELPERS (safe)
======================================================================== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function safeAddHidden(el){ if (el) el.classList.add("hidden-screen"); }
function safeRemoveHidden(el){ if (el) el.classList.remove("hidden-screen"); }

function switchScreen(hideId, showId) {
  const hideEl = document.getElementById(hideId);
  const showEl = document.getElementById(showId);
  if (hideEl) hideEl.classList.add("hidden-screen");
  if (showEl) showEl.classList.remove("hidden-screen");
}

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/* =========================================================================
   CRONÔMETRO
======================================================================== */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function clearCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function startCountdown(stageIndex) {
  clearCountdown();
  timeRemaining = initialTimeInSeconds;

  const timerElement = document.getElementById(`timer-${stageIndex}`);
  if (!timerElement) return;

  timerElement.textContent = `Tempo restante: ${formatTime(timeRemaining)}`;

  countdownInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining < 0) {
      clearCountdown();
      timerElement.textContent = "Tempo esgotado!";
      return;
    }
    timerElement.textContent = `Tempo restante: ${formatTime(timeRemaining)}`;
  }, 1000);
}

/* =========================================================================
   PROGRESSO
======================================================================== */
function updateProgressIndicator(stageIndex, isComplete = false) {
  const fill = document.getElementById("progressBarFill");
  const label = document.getElementById("progressLabel");
  if (!fill || !label) return;

  const totalStages = funnelStages.length;

  if (stageIndex < 0) {
    fill.style.width = "0%";
    label.textContent = "Seu progresso";
    return;
  }

  const segment = 100 / totalStages;
  const currentProgress = (isComplete ? (stageIndex + 1) : stageIndex) * segment;

  fill.style.width = `${currentProgress}%`;
  label.textContent = "Seu progresso";
}

/* =========================================================================
   SALDO (contador animado)
======================================================================== */
function animateSaldoCounter(startValue, endValue, duration) {
  const saldoEl = document.getElementById("currentSaldo");
  if (!saldoEl) return;

  let startTime = null;

  function step(ts) {
    if (!startTime) startTime = ts;
    const progress = ts - startTime;
    const pct = Math.min(progress / duration, 1);

    const cur = startValue + (endValue - startValue) * pct;
    saldoEl.textContent = formatCurrency(cur);

    if (pct < 1) requestAnimationFrame(step);
    else saldoEl.textContent = formatCurrency(endValue);
  }

  requestAnimationFrame(step);
}

function updateState(stageIndex) {
  const stage = funnelStages[stageIndex];
  const oldValue = currentSaldo;
  const newValue = currentSaldo + stage.cashback;

  animateSaldoCounter(oldValue, newValue, 500);
  currentSaldo = newValue;

  updateProgressIndicator(stageIndex, true);
}

/* =========================================================================
   UI/UX: QR Loader branco + Sucesso com confetes (com fallback)
   - QR: usa #processingModal (já existe no seu HTML)
   - Sucesso: se existir #successModal/#confettiCanvas -> usa confete
             senão usa #successOverlay (seu overlay antigo)
======================================================================== */
const uiUX = (() => {
  // QR loader branco (seu modal existente)
  const processingModal = document.getElementById("processingModal");

  // Sucesso “novo” (se você já adicionou os IDs do pacote)
  const successModal   = document.getElementById("successModal");
  const confettiCanvas = document.getElementById("confettiCanvas");
  const successTitle   = document.getElementById("successTitle");
  const successSub     = document.getElementById("successSub");
  const successAmount  = document.getElementById("successAmount");
  const successOk      = document.getElementById("successOk");

  // Fallback (seu overlay antigo)
  const successOverlay = document.getElementById("successOverlay");
  const successIcon    = document.querySelector("#successOverlay .success-animation-icon");

  // Áudios (HTML atual tem successSound; moneySound é opcional)
  const sfxSuccess = document.getElementById("successSound"); // seu áudio atual
  const sfxMoney   = document.getElementById("moneySound");   // opcional: /avaliar/media/money.mp3

  function play(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      const p = audioEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  // ===== Confetti (se existir canvas) =====
  let ctx = null;
  let confetti = [];
  let raf = null;

  const rand = (min, max) => Math.random() * (max - min) + min;

  function ensureCanvas() {
    if (!confettiCanvas) return false;
    if (!ctx) ctx = confettiCanvas.getContext("2d");
    return !!ctx;
  }

  function resizeCanvas() {
    if (!ensureCanvas()) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    confettiCanvas.width  = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst() {
    if (!ensureCanvas()) return;
    resizeCanvas();

    confetti = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    const cannons = [
      { x: w * 0.14, y: h * 0.55, dir:  1 },
      { x: w * 0.86, y: h * 0.55, dir: -1 },
    ];

    const colors = ["#58b947","#49b7a7","#e4b93c","#e25555","#7c3aed","#0ea5e9","#f97316"];

    cannons.forEach(c => {
      for (let i=0;i<120;i++){
        confetti.push({
          x:c.x, y:c.y,
          vx: rand(2.5, 8.5) * c.dir,
          vy: rand(-10, -3),
          g:  rand(0.18, 0.32),
          size: rand(4, 8),
          rot: rand(0, Math.PI*2),
          vr:  rand(-0.2, 0.2),
          life: rand(52, 90),
          color: colors[(Math.random()*colors.length)|0],
          shape: Math.random() > 0.3 ? "rect" : "dot"
        });
      }
    });

    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  function loop() {
    if (!ensureCanvas()) return;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      p.life--;

      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size/2, -p.size/2, p.size*1.2, p.size*0.7);
      } else {
        ctx.beginPath();
        ctx.arc(0,0,p.size*0.45,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    });

    confetti = confetti.filter(p => p.life > 0 && p.y < window.innerHeight + 80);
    if (confetti.length) raf = requestAnimationFrame(loop);
    else {
      raf = null;
      ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    }
  }

  if (confettiCanvas) {
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  // ===== API =====
  function showQrLoader() {
    if (!processingModal) return;
    processingModal.classList.remove("hidden-screen");
  }

  function hideQrLoader() {
    if (!processingModal) return;
    processingModal.classList.add("hidden-screen");
  }

  function showSuccess({ title="Sucesso!", sub="Ação concluída.", amount=null, sound="success" } = {}) {
    // Preferência: modal novo (se existir)
    if (successModal) {
      if (successTitle) successTitle.textContent = title;
      if (successSub) successSub.textContent = sub;

      if (successAmount) {
        if (amount != null) {
          successAmount.style.display = "";
          successAmount.textContent = amount;
        } else {
          successAmount.style.display = "none";
          successAmount.textContent = "";
        }
      }

      successModal.classList.remove("is-hidden");
      burst();

      if (sound === "money") play(sfxMoney || sfxSuccess);
      else play(sfxSuccess);

      return;
    }

    // Fallback: overlay antigo (sem confete)
    if (successOverlay) {
      successOverlay.classList.remove("hidden-screen");
      if (sound === "money") play(sfxMoney || sfxSuccess);
      else play(sfxSuccess);

      // animação opcional (se você tiver CSS)
      if (successIcon) {
        successIcon.classList.add("animate");
        setTimeout(() => successIcon.classList.remove("animate"), 500);
      }
      return;
    }
  }

  function hideSuccess() {
    if (successModal) successModal.classList.add("is-hidden");
    if (successOverlay) successOverlay.classList.add("hidden-screen");
  }

  if (successOk) successOk.addEventListener("click", hideSuccess);

  return { showQrLoader, hideQrLoader, showSuccess, hideSuccess, play };
})();

/* =========================================================================
   TELAS
======================================================================== */
function showCodeScreen(stage) {
  const headerVal = document.getElementById("codeBoxHeaderValue");
  if (headerVal) headerVal.textContent = formatCurrency(stage.cashback);

  const codeDisplay = document.getElementById("codeDisplayArea");
  if (codeDisplay) {
    codeDisplay.innerHTML = stage.code
      .split("")
      .map(ch => `<span class="code-char">${ch}</span>`)
      .join("");
  }

  const codeInputs = $$("#codeScreen .input-square");
  codeInputs.forEach(i => (i.value = ""));
  if (codeInputs[0]) codeInputs[0].focus();

  updateProgressIndicator(currentStage);

  // garante esconder QR loader se estiver aberto
  uiUX.hideQrLoader();

  switchScreen("loadingScreen", "codeScreen");
}

function showEvaluationScreen(stageIndex) {
  const stage = funnelStages[stageIndex];

  // mostra só o bloco da avaliação atual
  $$("#evaluationScreen .evaluation-item").forEach(el => el.classList.add("hidden-screen"));
  const currentItem = document.getElementById(`evaluation-${stageIndex}`);
  if (currentItem) currentItem.classList.remove("hidden-screen");

  // atualiza texto (nome/valor)
  const clientNameEl = document.querySelector(`[data-client-name="${stageIndex}"]`);
  const cashbackValEl = document.querySelector(`[data-cashback-value="${stageIndex}"]`);

  if (clientNameEl) {
    const parts = stage.client.split(" ");
    clientNameEl.textContent = `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
  }
  if (cashbackValEl) cashbackValEl.textContent = formatCurrency(stage.cashback).replace("R$ ", "");

  // troca tela
  safeAddHidden(document.getElementById("codeScreen"));
  safeRemoveHidden(document.getElementById("evaluationScreen"));
}

/* =========================================================================
   TRANSIÇÕES PRINCIPAIS
======================================================================== */
function unlockAudioOnce() {
  if (isAudioUnlocked) return;
  const a = document.getElementById("successSound");
  if (!a) { isAudioUnlocked = true; return; }

  try {
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        isAudioUnlocked = true;
      }).catch(() => {
        // se não desbloquear aqui, desbloqueia no primeiro clique (ok)
      });
    } else {
      a.pause();
      a.currentTime = 0;
      isAudioUnlocked = true;
    }
  } catch (_) {}
}

function startSuccessTransition(codeInputs, correctCode) {
  const entered = codeInputs.map(i => (i.value || "")).join("").toUpperCase();

  if (entered !== correctCode) {
    alert("Código incorreto. Tente novamente.");
    codeInputs.forEach(i => (i.value = ""));
    if (codeInputs[0]) codeInputs[0].focus();
    return;
  }

  // ✅ Sucesso moderno + confete (e som success)
  uiUX.showSuccess({
    title: "Código confirmado!",
    sub: "Estamos liberando seu cashback…",
    amount: null,
    sound: "success"
  });

  // fecha sucesso rápido e abre QR loader branco na mesma sequência
  setTimeout(() => {
    uiUX.hideSuccess();
    safeAddHidden(document.getElementById("codeScreen"));
    uiUX.showQrLoader();

    // simula consulta e avança para avaliação
    setTimeout(() => {
      uiUX.hideQrLoader();
      showEvaluationScreen(currentStage);
      startCountdown(currentStage);
    }, qrConsultationDuration);

  }, animationDuration);
}

function advanceFunnel(voteValue) {
  clearCountdown();

  // ✅ Sucesso moderno + som dinheiro (se existir moneySound)
  uiUX.showSuccess({
    title: "Avaliação registrada!",
    sub: "Você ganhou cashback.",
    amount: null,
    sound: "money"
  });

  // atualiza saldo/progresso imediatamente (por trás)
  updateState(currentStage);

  setTimeout(() => {
    uiUX.hideSuccess();

    // se ainda há próxima etapa
    if (currentStage < funnelStages.length - 1) {
      currentStage++;

      // ✅ entre etapas: QR loader branco (não usa “tela verde”)
      safeAddHidden(document.getElementById("evaluationScreen"));
      uiUX.showQrLoader();

      setTimeout(() => {
        uiUX.hideQrLoader();
        // mostra o próximo código direto (sequência na mesma tela)
        showCodeScreen(funnelStages[currentStage]);
      }, qrConsultationDuration);

    } else {
      // fim do funil
      safeAddHidden(document.getElementById("evaluationScreen"));

      const finalPrize = document.getElementById("finalPrizeValue");
      if (finalPrize) finalPrize.textContent = formatCurrency(currentSaldo);

      safeRemoveHidden(document.getElementById("finalSuccessModal"));
    }
  }, 900);
}

/* =========================================================================
   INIT ÚNICO (sem duplicar listeners)
======================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // estado inicial
  const saldoEl = document.getElementById("currentSaldo");
  if (saldoEl) saldoEl.textContent = formatCurrency(currentSaldo);

  updateProgressIndicator(-1);

  // garante que a página não fique travada no loading se algo falhar
  const watchdog = setTimeout(() => {
    // se ainda estiver no loading, força ir pro primeiro código
    const loading = document.getElementById("loadingScreen");
    const code = document.getElementById("codeScreen");
    if (loading && !loading.classList.contains("hidden-screen") && code && code.classList.contains("hidden-screen")) {
      updateProgressIndicator(0);
      showCodeScreen(funnelStages[0]);
    }
  }, loadingDuration + 1200);

  // começa no loading (PROCURANDO VALORES...) e avança para o primeiro código
  setTimeout(() => {
    updateProgressIndicator(0);
    showCodeScreen(funnelStages[0]);
    clearTimeout(watchdog);
  }, loadingDuration);

  // desbloqueio de áudio: primeira digitação ou clique
  const firstInput = $('#codeInputArea input[data-index="0"]');
  if (firstInput) {
    firstInput.addEventListener("input", unlockAudioOnce, { once: true });
  }
  document.addEventListener("click", unlockAudioOnce, { once: true });

  // inputs do código
  const codeInputs = $$("#codeScreen .input-square");
  codeInputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      e.target.value = (e.target.value || "").toUpperCase();

      if (e.target.value.length === 1) {
        if (idx < codeInputs.length - 1) {
          codeInputs[idx + 1].focus();
        } else {
          startSuccessTransition(codeInputs, funnelStages[currentStage].code);
        }
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        codeInputs[idx - 1].focus();
      }
    });
  });

  // botões de avaliação
  const opinionButtons = $$("#evaluationScreen .opinion-buttons .opinion-button");
  opinionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      opinionButtons.forEach(b => (b.disabled = true));

      const vote = btn.getAttribute("data-vote");
      advanceFunnel(vote);

      setTimeout(() => opinionButtons.forEach(b => (b.disabled = false)), 1200);
    });
  });

  // botão final
  const watchVideoButton = document.getElementById("watchVideoButton");
  if (watchVideoButton) {
    watchVideoButton.addEventListener("click", () => {
      const next = new URL("../vsl", window.location.href);
      const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
      if (qs) next.search = qs;
      window.location.href = next.toString();
    });
  }

  // prender histórico (1x, sem duplicar)
  const urlDestino = "../back1";
  try {
    history.replaceState({ locked: true }, "", location.href);
    history.pushState({ locked: true, ghost: true }, "", location.href);

    window.addEventListener("popstate", () => {
      window.location.replace(urlDestino);
    });
  } catch (_) {}
});
