// =========================================================================
// VARIÁVEIS DE ESTADO E CONFIGURAÇÃO
// =========================================================================
let currentStage = 0; // 0: Avaliação 1, 1: Avaliação 2, 2: Avaliação 3
let currentSaldo = 50.00; 

const qrConsultationDuration = 2500; 
const loadingDuration = 3000; // Tempo de Carregamento inicial
const slideUpDuration = 600; // Duração da animação de saldo
const animationDuration = 1200; // 1.2s para a animação de sucesso (CSS)

// VARIÁVEIS DO CRONÔMETRO
let countdownInterval = null; 
let initialTimeInSeconds = 140; 
let timeRemaining = initialTimeInSeconds; 

// FLAG: Garante que o áudio só é desbloqueado uma vez
let isAudioUnlocked = false; 

// Array de estágios do funil
const funnelStages = [
    { name: "Avaliação 1", client: "Beatriz S.", cashback: 49.67, code: "LMNO", htmlId: "evaluation-0" },
    { name: "Avaliação 2", client: "João A.", cashback: 44.67, code: "BCFG", htmlId: "evaluation-1" },
    { name: "Avaliação 3", client: "Camila B.", cashback: 57.75, code: "XYZA", htmlId: "evaluation-2" }
];

(() => {
  const successModal = document.getElementById("successModal");
  const confettiCanvas = document.getElementById("confettiCanvas");
  const successTitle = document.getElementById("successTitle");
  const successSub = document.getElementById("successSub");
  const successAmount = document.getElementById("successAmount");
  const successOk = document.getElementById("successOk");

  const qrLoader = document.getElementById("qrLoader");

  const sfxSuccess = document.getElementById("sfxSuccess");
  const sfxMoney = document.getElementById("sfxMoney");

  // ===== Confetti (canvas) =====
  const ctx = confettiCanvas.getContext("2d");
  let confetti = [];
  let raf = null;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const rand = (min, max) => Math.random() * (max - min) + min;

  function burst() {
    confetti = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    const cannons = [
      { x: w * 0.14, y: h * 0.55, dir: 1 },
      { x: w * 0.86, y: h * 0.55, dir: -1 },
    ];

    const colors = [
      "#58b947", "#49b7a7", "#e4b93c", "#e25555",
      "#7c3aed", "#0ea5e9", "#f97316"
    ];

    cannons.forEach(c => {
      for (let i = 0; i < 120; i++) {
        confetti.push({
          x: c.x, y: c.y,
          vx: rand(2.5, 8.5) * c.dir,
          vy: rand(-10, -3),
          g: rand(0.18, 0.32),
          size: rand(4, 8),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.2, 0.2),
          life: rand(52, 90),
          color: colors[(Math.random() * colors.length) | 0],
          shape: Math.random() > 0.3 ? "rect" : "dot"
        });
      }
    });

    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.rot += p.vr;
      p.life--;

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
    if (confetti.length) raf = requestAnimationFrame(loop);
    else { raf = null; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  // ===== Helpers =====
  function play(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      audioEl.play();
    } catch (e) {}
  }

  // ===== Public API =====
  window.uiUX = {
    showQrLoader() {
      qrLoader?.classList.remove("is-hidden");
      qrLoader?.setAttribute("aria-hidden", "false");
    },
    hideQrLoader() {
      qrLoader?.classList.add("is-hidden");
      qrLoader?.setAttribute("aria-hidden", "true");
    },

    showSuccess({ title="Sucesso!", sub="Ação concluída.", amount=null, sound="success" } = {}) {
      successTitle.textContent = title;
      successSub.textContent = sub;

      if (amount != null) {
        successAmount.style.display = "";
        successAmount.textContent = amount;
      } else {
        successAmount.style.display = "none";
        successAmount.textContent = "";
      }

      successModal.classList.remove("is-hidden");
      successModal.setAttribute("aria-hidden", "false");

      burst();

      if (sound === "money") play(sfxMoney);
      else if (sound === "success") play(sfxSuccess);
    },

    hideSuccess() {
      successModal.classList.add("is-hidden");
      successModal.setAttribute("aria-hidden", "true");
    },

    /**
     * Conecta botões de avaliação (ex.: data-vote) a uma animação de sucesso + som.
     * Use: uiUX.wireVoteButtons(".opinion-button");
     */
    wireVoteButtons(selector) {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", () => {
          window.uiUX.showSuccess({
            title: "Avaliação registrada!",
            sub: "Seu saldo foi atualizado.",
            amount: null,
            sound: "money"
          });
          setTimeout(() => window.uiUX.hideSuccess(), 900);
        });
      });
    }
  };

  // Close
  successOk?.addEventListener("click", () => window.uiUX.hideSuccess());
})();



// =========================================================================
// FUNÇÕES DO CRONÔMETRO (MANTIDAS)
// =========================================================================

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
    const timerElementId = `timer-${stageIndex}`;
    const timerElement = document.getElementById(timerElementId);

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


// =========================================================================
// FUNÇÕES DE FLUXO E ESTADO (MANTIDAS)
// =========================================================================

function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden-screen');
    document.getElementById(showId).classList.remove('hidden-screen');
}

function formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function updateProgressIndicator(stageIndex, isComplete = false) {
    const totalStages = funnelStages.length;
    
    if (stageIndex < 0) {
        document.getElementById('progressBarFill').style.width = `0%`;
        document.getElementById('progressLabel').textContent = `Seu progresso`;
        return;
    }
    
    const progressSegment = 100 / totalStages;
    let currentProgress = (isComplete ? (stageIndex + 1) : stageIndex) * progressSegment;
    let label = `Seu progresso`; 

    document.getElementById('progressBarFill').style.width = `${currentProgress}%`;
    document.getElementById('progressLabel').textContent = label;
}

// Função de animação de contagem de saldo
function animateSaldoCounter(startValue, endValue, duration) {
    const saldoElement = document.getElementById('currentSaldo');
    let startTime;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        const currentValue = startValue + (endValue - startValue) * percentage;
        
        saldoElement.textContent = formatCurrency(currentValue);

        if (progress < duration) {
            window.requestAnimationFrame(step);
        } else {
            saldoElement.textContent = formatCurrency(endValue);
        }
    }

    window.requestAnimationFrame(step);
}


function updateState(stageIndex) {
    const stage = funnelStages[stageIndex];
    
    const oldValue = currentSaldo; 
    const newValue = currentSaldo + stage.cashback;
    
    // 1. DISPARA A ANIMAÇÃO DO SALDO
    animateSaldoCounter(oldValue, newValue, 500); 
    currentSaldo = newValue; 

    // 2. Atualiza a barra de progresso (visual)
    updateProgressIndicator(stageIndex, true); 
}

function showCodeScreen(stage) {
    document.getElementById('codeBoxHeaderValue').textContent = formatCurrency(stage.cashback);
    
    const codeDisplay = document.getElementById('codeDisplayArea');
    codeDisplay.innerHTML = stage.code.split('').map(char => `<span class="code-char">${char}</span>`).join('');
    
    const codeInputs = document.querySelectorAll('#codeScreen .input-square');
    codeInputs.forEach(input => input.value = '');
    codeInputs[0].focus();
    
    updateProgressIndicator(currentStage); 
    
    switchScreen('loadingScreen', 'codeScreen');
}

function showEvaluationScreen(stageIndex) {
    const evaluationItems = document.querySelectorAll('#evaluationScreen .evaluation-item');
    const stage = funnelStages[stageIndex];

    evaluationItems.forEach(item => item.classList.add('hidden-screen'));
    const currentItem = document.getElementById(`evaluation-${stageIndex}`);

    if (currentItem) {
        currentItem.classList.remove('hidden-screen');
    }

    const clientNameElement = document.querySelector(`[data-client-name="${stageIndex}"]`);
    const cashbackValueElement = document.querySelector(`[data-cashback-value="${stageIndex}"]`);

    if (clientNameElement) clientNameElement.textContent = stage.client.split(' ')[0] + ' ' + stage.client.split(' ')[1].charAt(0) + '.';
    if (cashbackValueElement) cashbackValueElement.textContent = formatCurrency(stage.cashback).replace('R$ ', '');
}

// =========================================================================
// LÓGICA DE TRANSIÇÃO DO FUNIL PRINCIPAL
// =========================================================================

function playSuccessSound() {
    const successSound = document.getElementById('successSound');
    if (!successSound) return;

    successSound.currentTime = 0;
    successSound.play().catch(e => console.log("Áudio bloqueado. Requer interação prévia do usuário."));
}

function advanceFromQrCode() {
    setTimeout(() => {
        console.log(`Consulta finalizada. Avançando para Avaliação.`);
        
        showEvaluationScreen(currentStage); 
        
        document.getElementById('processingModal').classList.add('hidden-screen');
        document.getElementById('evaluationScreen').classList.remove('hidden-screen');
        
        startCountdown(currentStage);
        
    }, qrConsultationDuration);
}

function startSuccessTransition(codeInputs, correctCode, successOverlay) {
    let enteredCode = Array.from(codeInputs).map(input => input.value).join('');
    
    const successIcon = document.querySelector('#successOverlay .success-animation-icon');

    if (enteredCode.toUpperCase() === correctCode) {
        
        playSuccessSound(); 
        
        successOverlay.classList.remove('hidden-screen');
        successOverlay.classList.add('visible');
        successIcon.classList.add('animate'); 
        
        setTimeout(() => {
            successOverlay.classList.remove('visible');
            successOverlay.classList.add('hidden-screen');
            successIcon.classList.remove('animate'); 
            
            document.getElementById('codeScreen').classList.add('hidden-screen');
            document.getElementById('processingModal').classList.remove('hidden-screen');
            
            console.log(`Código correto. Iniciando consulta de QR Code...`);
            
            advanceFromQrCode(); 

        }, animationDuration);

    } else {
        alert("Código incorreto. Tente novamente.");
        codeInputs.forEach(input => input.value = '');
        codeInputs[0].focus();
    }
}

function advanceFunnel(voteValue) {
    
    clearCountdown(); 
    
    // 1. AUMENTA O SALDO E DISPARA ANIMAÇÃO
    updateState(currentStage);
    
    // 2. AVANÇA PARA O PRÓXIMO CARREGAMENTO APÓS A ANIMAÇÃO VISUAL DO SALDO
    setTimeout(() => {
        
        if (currentStage < funnelStages.length - 1) {
            
            // Reabilita botões para a próxima avaliação.
            const opinionButtons = document.querySelectorAll('#evaluationScreen .opinion-buttons .opinion-button');
            opinionButtons.forEach(btn => btn.disabled = false);

            switchScreen('evaluationScreen', 'loadingScreen');
            
            currentStage++;
            
            document.getElementById('progressBarFill').style.width = '0%';
            document.getElementById('progressLabel').textContent = "Seu progresso";
            
            setTimeout(() => {
                document.getElementById('progressBarFill').style.width = '100%'; 
            }, 100);

            setTimeout(() => {
                updateProgressIndicator(currentStage - 1); 
                showCodeScreen(funnelStages[currentStage]); 
                
            }, loadingDuration + 500);

        } else {
            // FIM DO FUNIL: MOSTRA O MODAL FINAL DE SAQUE
            
            // 1. Esconde a Tela de Avaliação
            document.getElementById('evaluationScreen').classList.add('hidden-screen');
            
            // 2. Atualiza o valor final do prêmio no modal (usa o valor atual do currentSaldo)
            document.getElementById('finalPrizeValue').textContent = formatCurrency(currentSaldo);
            
            // 3. Exibe o modal final
            document.getElementById('finalSuccessModal').classList.remove('hidden-screen');
        }
        
    }, 600); // Espera 600ms para a animação de 500ms terminar com segurança
}


// =========================================================================
// INICIALIZAÇÃO E LISTENERS
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const codeInputs = document.querySelectorAll('#codeScreen .input-square'); 
    const successOverlay = document.getElementById('successOverlay');
    const firstCodeInput = document.querySelectorAll('#codeInputArea input')[0]; 

    document.getElementById('currentSaldo').textContent = formatCurrency(currentSaldo);

    updateProgressIndicator(-1); 
    
    setTimeout(() => {
        document.getElementById('progressBarFill').style.width = '100%'; 
    }, 100);

    setTimeout(() => {
        updateProgressIndicator(0); 
        showCodeScreen(funnelStages[0]); 
    }, loadingDuration + 500); 

    // Desbloqueio silencioso do áudio na primeira interação de digitação
    firstCodeInput.addEventListener('input', () => {
        if (!isAudioUnlocked) {
            const successSound = document.getElementById('successSound');
            if (successSound) {
                successSound.play().then(() => {
                    successSound.pause();
                    successSound.currentTime = 0;
                    isAudioUnlocked = true;
                }).catch(e => {
                    console.log("Áudio desbloqueio falhou, mas fluxo continua.");
                });
            }
        }
    }, { once: true }); 

    // --- LÓGICA DE VALIDAÇÃO DE CÓDIGO (Tela 2) ---
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            
            if (e.target.value.length === 1) {
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                } else {
                    startSuccessTransition(codeInputs, funnelStages[currentStage].code, successOverlay);
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // --- LÓGICA DE AVALIAÇÃO (Tela 4) ---
    const opinionButtons = document.querySelectorAll('#evaluationScreen .opinion-buttons .opinion-button');
    opinionButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            opinionButtons.forEach(btn => btn.disabled = true);
            
            const voteValue = button.getAttribute('data-vote');
            
            advanceFunnel(voteValue);
            
            setTimeout(() => {
                 opinionButtons.forEach(btn => btn.disabled = false);
            }, 50); 
        });
    });
    
    // --- LÓGICA DO BOTÃO FINAL ---
    const watchVideoButton = document.getElementById('watchVideoButton');
    if (watchVideoButton) {
        watchVideoButton.addEventListener('click', () => {
            // CORREÇÃO: Redireciona para a página na pasta VSL
            (() => {
          const next = new URL("../vsl", window.location.href);
          const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
          if (qs) next.search = qs;
          window.location.href = next.toString();
        })();
        });
    }
});

const urlDestino = '../back1';

    // Função que será executada ao carregar a página
    function prenderHistorico() {
        // 1. Cria uma entrada fantasma no histórico (Push State)
        // O navegador agora vê esta página como se tivesse uma "próxima" entrada (que é a fantasma).
        // Ao clicar em 'Voltar', o usuário volta para esta entrada fantasma.
        // O estado (o primeiro argumento) é usado para identificar.
        history.pushState({ state: 'fantasma' }, null, location.href);
    }

    // Função que lida com o evento de navegação no histórico
    function redirecionarNoVoltar(event) {
        // O evento popstate é disparado. Agora checamos se o usuário voltou para o nosso estado fantasma.

        // Se o evento não tiver um estado (significando que voltou de uma página externa/primeiro clique),
        // OU se o estado for 'fantasma' (se o usuário avançou e voltou novamente para nosso ponto de controle).
        if (event.state === null || event.state.state === 'fantasma') {
            // Força o redirecionamento.
            // Usamos replace() para não adicionar a página '../back1' ao histórico,
            // prevenindo um loop infinito se o usuário clicar 'Voltar' novamente.
            window.location.replace(urlDestino);
        }

        // No caso do pushState, é bom também usar o replaceState no final para
        // "limpar" o estado fantasma se o usuário navegar para frente, mas 
        // para o seu caso de redirecionamento imediato, a lógica acima é suficiente.
    }

    // 1. Quando o DOM estiver pronto, adiciona a página fantasma ao histórico.
    document.addEventListener('DOMContentLoaded', prenderHistorico);

    // 2. Adiciona o listener para detectar a navegação (o clique no "Voltar")
    window.addEventListener('popstate', redirecionarNoVoltar);
