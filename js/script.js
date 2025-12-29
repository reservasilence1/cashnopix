document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const pageBackground = document.getElementById('pageBackground'); 
    const startButton = document.getElementById('startButton');

    // Tempo que a splash screen ficará visível (em milissegundos)
    const splashDuration = 3000; // 3 segundos

    // Oculta a splash screen e mostra o modal após o tempo definido
    setTimeout(() => {
        splashScreen.classList.add('fade-out'); 
        
        // Espera a transição de fade-out terminar antes de remover o display: none
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none'; 
            pageBackground.classList.remove('modal-hidden'); // Mostra o modal de parabéns
        }, { once: true }); 
        
    }, splashDuration);

    // Lógica do botão "Começar!"
    startButton.addEventListener('click', () => {
        // *** CAMINHO CORRIGIDO: Sai da pasta 'pre' (../) e entra na pasta 'avaliar' ***
        (() => {
          const next = new URL("/avaliar", window.location.origin);
          const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
          if (qs) next.search = qs;
          window.location.href = next.toString();
        })();
    });
});

// Seu arquivo.js existente

document.addEventListener('DOMContentLoaded', (event) => {
    // === COLE O CÓDIGO AQUI DENTRO ===

    const urlDestino = '../back1';

    // 1. Adiciona um estado (dummy state) ao histórico de navegação
    history.replaceState(null, null, location.href);

    // 2. Adiciona um listener para o evento 'popstate'
    window.addEventListener('popstate', function (event) {
        // Força o redirecionamento para a URL de destino
        // O replace() impede que a nova página entre no histórico.
        window.location.replace(urlDestino);
    });

    // ===================================
});

// Outras funções do seu arquivo.js podem vir aqui fora ou dentro, dependendo do que fazem.

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