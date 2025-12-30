/**
 * Exibe uma caixa de alerta customizada no topo da tela.
 * (Função sem alteração)
 */
function alertBox(message, type = 'info') {
    const existingAlert = document.getElementById('custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.id = 'custom-alert';
    alertDiv.className = `fixed top-5 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white text-sm font-semibold z-50 shadow-xl transition-opacity duration-300`;
    alertDiv.style.opacity = 0;

    let bgColor;
    if (type === 'success') {
        bgColor = 'bg-green-500';
    } else if (type === 'error') {
        bgColor = 'bg-red-500';
    } else {
        bgColor = 'bg-gray-700';
    }
    alertDiv.classList.add(bgColor);
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = 1;
    }, 50);

    setTimeout(() => {
        alertDiv.style.opacity = 0;
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

/**
 * Trata o login e exibe o modal de boas-vindas.
 * --- ATUALIZADO ---
 */
function handleLogin() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    const welcomeModal = document.getElementById('welcome-modal');

    if (email && emailInput.checkValidity()) {
        
        // --- NOVO: Extrai o nome de usuário (parte antes do @) ---
        const username = email.split('@')[0];
        
        // --- NOVO: Armazena o nome no próprio elemento do modal ---
        // Usamos 'dataset' para guardar a informação
        welcomeModal.dataset.username = username;

        console.log('Login bem-sucedido. Exibindo modal de boas-vindas.');
        welcomeModal.classList.add('open');
        document.body.style.overflow = 'hidden'; 
        
    } else {
        alertBox('Por favor, introduza um e-mail válido.', 'error');
    }
}

/**
 * Event Listener para redirecionar ao clicar no botão do modal
 * --- ATUALIZADO ---
 */
document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcome-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            
            // --- NOVO: Pega o nome que guardamos no modal ---
            const username = welcomeModal.dataset.username;

            // --- NOVO: Redireciona com o nome como parâmetro URL ---
            // A URL ficará assim: ../av3/index.html?name=joao
            // Usamos encodeURIComponent para garantir que nomes com '.' ou '-' funcionem
            window.location.href = `../av3/index.html?name=${encodeURIComponent(username)}`;
            
        });
    }
});