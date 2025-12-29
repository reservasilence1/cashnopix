/* =========================================================================
   cashnopix /avaliar/js/script.js (AJUSTADO)
   - Remove travamento no "PROCURANDO VALORES..."
   - Mantém o loading inicial (PROCURANDO VALORES PARA SAQUE)
   - Usa o processingModal (modal branco) como “loader entre etapas”
   - Animação ao digitar o código: confete + check gigante (usa #successOverlay)
   - Sucesso + som “money” ao votar (se existir #moneySound), senão usa successSound
   - Remove DOMContentLoaded duplicado e prende histórico 1x (sem conflito)
======================================================================== */

/* =========================================================================
   VARIÁVEIS DE ESTADO E CONFIGURAÇÃO
======================================================================== */
let currentStage = 0;                 // 0..2
let currentSaldo = 50.00;

const qrConsultationDuration = 2500;  // tempo da “consulta QR” (processingModal)
const loadingDuration = 3000;         // tempo do loading inicial (PROCURANDO...)
const animationDuration = 900;        // duração da animação sucesso (overlay)

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
   UI/UX
   - QR loader branco: #processingModal (já existe no HTML)
   - Sucesso código: #successOverlay (confete + check no CSS)
   - Sucesso voto: pode reutilizar #successOverlay também
======================================================================== */
const uiUX = (() => {
  const processingModal = document.getElementById("processingModal");

  const successOverlay = document.getElementById("successOverlay");
  const sfxSuccess = document.getElementById("successSound");
  const sfxMoney   = document.getElementById("moneySound"); // opcional

  function play(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      const p = audioEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  function showQrLoader() {
    if (!processingModal) return;
    processingModal.classList.remove("hidden-screen");
  }

  function hideQrLoader() {
    if (!processingModal) return;
    processingModal.classList.add("hidden-screen");
  }

  function showSuccess({ sound="success" } = {}) {
    if (!successOverlay) return;

    successOverlay.classList.remove("hidden-screen");
    successOverlay.classList.add("visible");

    if (sound === "money") play(sfxMoney || sfxSuccess);
    else play(sfxSuccess);
  }

  function hideSuccess() {
    if (!successOverlay) return;
    successOverlay.classList.remove("visible");
    successOverlay.classList.add("hidden-screen");
  }

  return { showQrLoader, hideQrLoader, showSuccess, hideSuccess };
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

  uiUX.hideQrLoader();
  switchScreen("loadingScreen", "codeScreen");
}

function showEvaluationScreen(stageIndex) {
  const stage = funnelStages[stageIndex];

  $$("#evaluationScreen .evaluation-item").forEach(el => el.classList.add("hidden-screen"));
  const currentItem = document.getElementById(`evaluation-${stageIndex}`);
  if (currentItem) currentItem.classList.remove("hidden-screen");

  const clientNameEl = document.querySelector(`[data-client-name="${stageIndex}"]`);
  const cashbackValEl = document.querySelector(`[data-cashback-value="${stageIndex}"]`);

  if (clientNameEl) {
    const parts = stage.client.split(" ");
    clientNameEl.textContent = `${parts[0]} ${parts[1]?.charAt(0) || ""}.`.trim();
  }
  if (cashbackValEl) cashbackValEl.textContent = formatCurrency(stage.cashback).replace("R$ ", "");

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
      }).catch(() => {});
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

  // ✅ animação igual print: confete + check gigante (CSS do #successOverlay.visible)
  uiUX.showSuccess({ sound: "success" });

  // trava inputs pra evitar disparo duplo
  codeInputs.forEach(i => (i.disabled = true));

  setTimeout(() => {
    uiUX.hideSuccess();
    codeInputs.forEach(i => (i.disabled = false));

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

  // ✅ sucesso ao votar (som dinheiro se existir)
  uiUX.showSuccess({ sound: "money" });

  updateState(currentStage);

  setTimeout(() => {
    uiUX.hideSuccess();

    if (currentStage < funnelStages.length - 1) {
      currentStage++;

      safeAddHidden(document.getElementById("evaluationScreen"));
      uiUX.showQrLoader();

      setTimeout(() => {
        uiUX.hideQrLoader();
        showCodeScreen(funnelStages[currentStage]);
      }, qrConsultationDuration);

    } else {
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
  // saldo inicial
  const saldoEl = document.getElementById("currentSaldo");
  if (saldoEl) saldoEl.textContent = formatCurrency(currentSaldo);

  // progresso inicial
  updateProgressIndicator(-1);

  // watchdog anti-travamento no “PROCURANDO…”
  const watchdog = setTimeout(() => {
    const loading = document.getElementById("loadingScreen");
    const code = document.getElementById("codeScreen");
    if (loading && !loading.classList.contains("hidden-screen") && code && code.classList.contains("hidden-screen")) {
      updateProgressIndicator(0);
      showCodeScreen(funnelStages[0]);
    }
  }, loadingDuration + 1400);

  // mantém o loading inicial (PROCURANDO VALORES PARA SAQUE)
  setTimeout(() => {
    updateProgressIndicator(0);
    showCodeScreen(funnelStages[0]);
    clearTimeout(watchdog);
  }, loadingDuration);

  // desbloqueio de áudio
  const firstInput = $('#codeInputArea input[data-index="0"]');
  if (firstInput) firstInput.addEventListener("input", unlockAudioOnce, { once: true });
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

  // prender histórico (1x)
  const urlDestino = "../back1";
  try {
    history.replaceState({ locked: true }, "", location.href);
    history.pushState({ locked: true, ghost: true }, "", location.href);

    window.addEventListener("popstate", () => {
      window.location.replace(urlDestino);
    });
  } catch (_) {}
});
