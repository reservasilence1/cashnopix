// =========================================================================
// VARIÁVEIS DE ESTADO E CONFIGURAÇÃO
// =========================================================================
let currentStage = 0; // 0: Avaliação 1, 1: Avaliação 2, 2: Avaliação 3
let currentSaldo = 504.38; // SALDO INICIAL CORRETO

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

// Array de estágios do funil (DADOS CORRIGIDOS)
const funnelStages = [
    { name: "Avaliação 1", client: "Lucas L.", cashback: 297.58, code: "ZABC", htmlId: "evaluation-0" },
    { name: "Avaliação 2", client: "Mariana F.", cashback: 299.82, code: "FGHI", htmlId: "evaluation-1" },
    { name: "Avaliação 3", client: "Rafael P.", cashback: 297.97, code: "QRST", htmlId: "evaluation-2" }
];

// =========================================================================
// FUNÇÕES DO CRONÔMETRO
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
// FUNÇÕES DE FLUXO E ESTADO
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

// Função de animação de contagem de saldo (usada no header)
function animateSaldoCounter(startValue, endValue, duration, targetElementId = 'currentSaldo') {
    const saldoElement = document.getElementById(targetElementId);
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
    
    // 1. DISPARA A ANIMAÇÃO DO SALDO NO HEADER
    animateSaldoCounter(oldValue, newValue, 500, 'currentSaldo'); 
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

// NOVO: Função para animar o círculo do modal final
function animateFinalCircleAndValue(finalValue) {
    const progressCircle = document.getElementById('progressCircle');
    const animatedFinalPrizeValue = document.getElementById('animatedFinalPrizeValue');
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference; // Começa vazio

    // Animação do círculo (preenchimento total)
    setTimeout(() => {
        progressCircle.style.strokeDashoffset = '0'; // Preenche completamente
    }, 100); // Pequeno atraso para garantir que o CSS aplique o estado inicial antes da transição

    // Animação da contagem do valor
    animateSaldoCounter(0, finalValue, 1500, 'animatedFinalPrizeValue'); // 1.5 segundos para animar o saldo
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
            
            // 2. Atualiza o valor final do prêmio no modal e no botão
            const finalPrize = currentSaldo;
            const finalPrizeFormatted = formatCurrency(finalPrize);
            
            // 3. Exibe o modal final e inicia as animações
            document.getElementById('finalSuccessModal').classList.remove('hidden-screen');
            
            // Inicia a animação do círculo e do valor
            animateFinalCircleAndValue(finalPrize);
            
            // Atualiza o texto do botão
            document.getElementById('watchVideoButton').textContent = `Sacar ${finalPrizeFormatted}`;
        }
        
    }, 600); // Espera 600ms para a animação de 500ms terminar com segurança
}


// =========================================================================
// INICIALIZAÇÃO E LISTENERS
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE PERSONALIZAÇÃO DE NOME ---
    const params = new URLSearchParams(window.location.search);
    const username = params.get('name') ?? 'User';
    const welcomeElement = document.getElementById('welcome-message');

    if (welcomeElement) {
        const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
        welcomeElement.textContent = `Olá, ${capitalizedUsername}!`;
    }
    // --- FIM DA LÓGICA DE NOME ---

    const codeInputs = document.querySelectorAll('#codeScreen .input-square'); 
    const successOverlay = document.getElementById('successOverlay');
    const firstCodeInput = document.querySelectorAll('#codeInputArea input')[0]; 

    // ATUALIZA O SALDO INICIAL VISÍVEL
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
           
            // REDIRECIONA PARA A PASTA VSL
            // LINHA NOVA
        (() => {
              const next = new URL("../saque2/?name=${encodeURIComponent(username)}", window.location.href);
              const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
              if (qs) next.search = qs;
              window.location.href = next.toString();
            })();
        });
    }
});