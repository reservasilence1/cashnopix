/* =========================================================================
   cashnopix /avaliar/js/script.js (2 POPUPS: código + avaliar)
======================================================================== */

let currentStage = 0;
let currentSaldo = 50.0;

const qrConsultationDuration = 2500;
const loadingDuration = 3000;

const codeSuccessDuration = 900;   // popup 1 (código digitado)
const voteSuccessDuration = 1800;  // popup 2 (avaliar) parecido com print

let countdownInterval = null;
let initialTimeInSeconds = 140;
let timeRemaining = initialTimeInSeconds;

let isAudioUnlocked = false;

const funnelStages = [
  { name: "Avaliação 1", client: "Beatriz S.", cashback: 49.67, code: "LMNO", htmlId: "evaluation-0" },
  { name: "Avaliação 2", client: "João A.",   cashback: 44.67, code: "BCFG", htmlId: "evaluation-1" },
  { name: "Avaliação 3", client: "Camila B.", cashback: 57.75, code: "XYZA", htmlId: "evaluation-2" }
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeAddHidden(el) { if (el) el.classList.add("hidden-screen"); }
function safeRemoveHidden(el) { if (el) el.classList.remove("hidden-screen"); }

function switchScreen(hideId, showId) {
  const hideEl = document.getElementById(hideId);
  const showEl = document.getElementById(showId);
  if (hideEl) hideEl.classList.add("hidden-screen");
  if (showEl) showEl.classList.remove("hidden-screen");
}

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/* ============ CRONÔMETRO ============ */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

/* ============ PROGRESSO ============ */
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

/* ============ SALDO ============ */
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
======================================================================== */
const uiUX = (() => {
  const processingModal = document.getElementById("processingModal");
  const successOverlay = document.getElementById("successOverlay");

  const sfxSuccess = document.getElementById("successSound");
  const sfxMoney = document.getElementById("moneySound"); // opcional

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

  /* ---------- POPUP 1: sucesso do código (confete minimalista) ---------- */
  function ensureCodeSuccessDOM() {
    if (!successOverlay) return null;

    // já existe?
    let burst = successOverlay.querySelector(".success-burst");
    if (burst) return burst;

    // reaproveita qualquer ícone existente, senão cria
    let icon = successOverlay.querySelector(".success-animation-icon");
    if (!icon) {
      icon = document.createElement("div");
      icon.className = "success-animation-icon";
    }

    const conf = document.createElement("div");
    conf.className = "success-confetti";

    burst = document.createElement("div");
    burst.className = "success-burst";
    burst.appendChild(conf);
    burst.appendChild(icon);

    successOverlay.innerHTML = "";
    successOverlay.appendChild(burst);

    return burst;
  }

  function spawnMinimalConfetti() {
    const burst = ensureCodeSuccessDOM();
    if (!burst) return;

    const conf = burst.querySelector(".success-confetti");
    if (!conf) return;

    conf.innerHTML = "";

    const colors = ["#58b947", "#49b7a7", "#e4b93c", "#e25555"];
    const pieces = 14;

    for (let i = 0; i < pieces; i++) {
      const p = document.createElement("i");
      if (Math.random() < 0.45) p.classList.add("dot");

      const c = colors[(Math.random() * colors.length) | 0];
      const rot = Math.floor(Math.random() * 180) - 90;

      const x = Math.floor(Math.random() * 120) - 60;
      const y = -Math.floor(Math.random() * 90 + 55);
      const d = Math.floor(Math.random() * 220);

      p.style.setProperty("--c", c);
      p.style.setProperty("--rot", `${rot}deg`);
      p.style.setProperty("--x", `${x}px`);
      p.style.setProperty("--y", `${y}px`);
      p.style.setProperty("--d", `${d}ms`);

      conf.appendChild(p);
    }
  }

  function showCodeSuccess() {
    if (!successOverlay) return;

    // reinicia
    successOverlay.classList.remove("hidden-screen");
    successOverlay.classList.remove("visible");
    // reflow
    void successOverlay.offsetHeight;

    spawnMinimalConfetti();
    successOverlay.classList.add("visible");

    play(sfxSuccess);
  }

  function hideCodeSuccess() {
    if (!successOverlay) return;
    successOverlay.classList.remove("visible");
    successOverlay.classList.add("hidden-screen");
  }

  /* ---------- POPUP 2: sucesso ao avaliar (print) ---------- */
  function ensureVoteSuccessDOM() {
    let wrap = document.querySelector(".vote-success");
    if (wrap) return wrap;

    wrap = document.createElement("div");
    wrap.className = "vote-success hidden-screen";

    wrap.innerHTML = `
      <div class="vote-success__card" role="dialog" aria-modal="true">
        <div class="vote-success__icon" aria-hidden="true"></div>
        <div class="vote-success__title">Saldo atualizado!</div>
        <div class="vote-success__sub">Você recebeu:</div>
        <div class="vote-success__amount" id="voteSuccessAmount">R$ 0,00</div>
      </div>
    `;

    document.body.appendChild(wrap);
    return wrap;
  }

  function showVoteSuccess(amountStr) {
    const wrap = ensureVoteSuccessDOM();
    const amountEl = wrap.querySelector("#voteSuccessAmount");
    if (amountEl) amountEl.textContent = amountStr;

    wrap.classList.remove("hidden-screen");
    play(sfxMoney || sfxSuccess);
  }

  function hideVoteSuccess() {
    const wrap = document.querySelector(".vote-success");
    if (!wrap) return;
    wrap.classList.add("hidden-screen");
  }

  return {
    showQrLoader,
    hideQrLoader,
    showCodeSuccess,
    hideCodeSuccess,
    showVoteSuccess,
    hideVoteSuccess
  };
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
   TRANSIÇÕES
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

  uiUX.showCodeSuccess();
  codeInputs.forEach(i => (i.disabled = true));

  setTimeout(() => {
    uiUX.hideCodeSuccess();
    codeInputs.forEach(i => (i.disabled = false));

    safeAddHidden(document.getElementById("codeScreen"));
    uiUX.showQrLoader();

    setTimeout(() => {
      uiUX.hideQrLoader();
      showEvaluationScreen(currentStage);
      startCountdown(currentStage);
    }, qrConsultationDuration);

  }, codeSuccessDuration);
}

function advanceFunnel(voteValue) {
  clearCountdown();

  // POPUP 2 (print)
  const received = formatCurrency(funnelStages[currentStage].cashback);
  uiUX.showVoteSuccess(received);

  updateState(currentStage);

  setTimeout(() => {
    uiUX.hideVoteSuccess();

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
  }, voteSuccessDuration);
}

/* =========================================================================
   INIT
======================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const saldoEl = document.getElementById("currentSaldo");
  if (saldoEl) saldoEl.textContent = formatCurrency(currentSaldo);

  updateProgressIndicator(-1);

  const watchdog = setTimeout(() => {
    const loading = document.getElementById("loadingScreen");
    const code = document.getElementById("codeScreen");
    if (loading && !loading.classList.contains("hidden-screen") && code && code.classList.contains("hidden-screen")) {
      updateProgressIndicator(0);
      showCodeScreen(funnelStages[0]);
    }
  }, loadingDuration + 1400);

  setTimeout(() => {
    updateProgressIndicator(0);
    showCodeScreen(funnelStages[0]);
    clearTimeout(watchdog);
  }, loadingDuration);

  const firstInput = $('#codeInputArea input[data-index="0"]');
  if (firstInput) firstInput.addEventListener("input", unlockAudioOnce, { once: true });
  document.addEventListener("click", unlockAudioOnce, { once: true });

  const codeInputs = $$("#codeScreen .input-square");
  codeInputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      e.target.value = (e.target.value || "").toUpperCase();

      if (e.target.value.length === 1) {
        if (idx < codeInputs.length - 1) codeInputs[idx + 1].focus();
        else startSuccessTransition(codeInputs, funnelStages[currentStage].code);
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) codeInputs[idx - 1].focus();
    });
  });

  const opinionButtons = $$("#evaluationScreen .opinion-buttons .opinion-button");
  opinionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      opinionButtons.forEach(b => (b.disabled = true));
      const vote = btn.getAttribute("data-vote");
      advanceFunnel(vote);
      setTimeout(() => opinionButtons.forEach(b => (b.disabled = false)), voteSuccessDuration + 150);
    });
  });

  const watchVideoButton = document.getElementById("watchVideoButton");
  if (watchVideoButton) {
    watchVideoButton.addEventListener("click", () => {
      const next = new URL("../vsl", window.location.href);
      const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
      if (qs) next.search = qs;
      window.location.href = next.toString();
    });
  }

  const urlDestino = "../back1";
  try {
    history.replaceState({ locked: true }, "", location.href);
    history.pushState({ locked: true, ghost: true }, "", location.href);
    window.addEventListener("popstate", () => window.location.replace(urlDestino));
  } catch (_) {}
});
