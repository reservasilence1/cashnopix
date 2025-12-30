document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // LÓGICA DE PERSONALIZAÇÃO DO USUÁRIO
    // ===============================================
    const welcomeMessageElement = document.getElementById('welcome-message');
    const params = new URLSearchParams(window.location.search);

    let usernameRaw = params.get('name');
    let finalUsernameDisplay = 'User';
    let usernameForUrl = 'padrao';

    if (!usernameRaw) {
        usernameRaw = sessionStorage.getItem('username');
    }

    if (usernameRaw) {
        usernameForUrl = usernameRaw.toLowerCase().replace(/\s/g, '.');
        finalUsernameDisplay = usernameRaw.charAt(0).toUpperCase() + usernameRaw.slice(1);
        sessionStorage.setItem('username', usernameRaw);
    } 
    
    if (welcomeMessageElement) {
        welcomeMessageElement.textContent = welcomeMessageElement.textContent.replace('[USERNAME]', finalUsernameDisplay);
    }


    // ===============================================
    // LÓGICA: MOSTRAR BOTÃO APÓS TEMPO (1:58 = 118s)
    // ===============================================
    const CTA_DELAY_SECONDS = 118; // Tempo para mostrar o botão em segundos
    const ctaButton = document.getElementById('cta-extrato-pulsante');
    const ctaAviso = document.getElementById('cta-aviso');
    const extratoSection = document.getElementById('extrato-section');
    
    // Função para mostrar o botão CTA
    function showCtaButton() {
        // Mostra o botão pulsante e o aviso
        ctaButton.classList.remove('hidden');
        ctaAviso.classList.remove('hidden');
        
        ctaButton.style.display = 'block';
        ctaAviso.style.display = 'block';

        setTimeout(() => {
            ctaButton.style.opacity = '1';
            ctaAviso.style.opacity = '1';
        }, 50);
    }

    // Define um temporizador para chamar a função após o tempo definido
    setTimeout(showCtaButton, CTA_DELAY_SECONDS * 1000);
    
    
    // Lógica ao clicar no botão "VER EXTRATO"
    ctaButton.addEventListener('click', () => {
        // 1. Mostra a seção de extrato
        extratoSection.classList.remove('hidden');
        extratoSection.style.display = 'block';
        
        // 2. Faz o fade-in e ROLA suavemente para ela
        setTimeout(() => {
            extratoSection.style.opacity = '1';
            
            // Rola a tela até o início da seção de extrato
            extratoSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 50);
    });

    // ===============================================
    // LÓGICA: REDIRECIONAR AO CLICAR EM "LIBERAR SAQUE"
    // ===============================================
    
    // 1. Seleciona o botão de liberar saque
    const liberarSaqueButton = document.querySelector('.liberar-saque-button');

    // 2. Adiciona o evento de clique
    liberarSaqueButton.addEventListener('click', () => {
        
        // !! IMPORTANTE: SUBSTITUA "SEU-LINK" ABAIXO !!
        const linkDeDestino = `https://payermex.com/checkout/0751f993-ab84-43d3-a01a-d77fd069a2b0`;
        
        // 3. Redireciona o usuário
        (() => {
          const next = new URL(linkDeDestino, window.location.href);
          const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
          if (qs && !next.search) next.search = qs; // só adiciona se o destino não tiver query
          window.location.href = next.toString();
        })();
    });
});