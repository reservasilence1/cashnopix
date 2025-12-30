document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // LÓGICA DE PERSONALIZAÇÃO DO USUÁRIO
    // ===============================================
    const welcomeMessageElement = document.getElementById('welcome-message');
    const params = new URLSearchParams(window.location.search);

    let usernameRaw = params.get('name'); // Nome original vindo da URL
    let finalUsernameDisplay = 'User'; // Nome para exibição (capitalizado)
    let usernameForUrl = 'padrao'; // Nome limpo para ser enviado na URL

    // 1. Tenta obter o nome da URL ou da sessionStorage
    if (!usernameRaw) {
        usernameRaw = sessionStorage.getItem('username');
    }

    if (usernameRaw) {
        // Define o nome limpo para ser enviado na URL (minúsculo, sem espaços)
        usernameForUrl = usernameRaw.toLowerCase().replace(/\s/g, '.');
        
        // Define o nome capitalizado para exibição na página atual
        finalUsernameDisplay = usernameRaw.charAt(0).toUpperCase() + usernameRaw.slice(1);
        
        // Salva na sessionStorage para uso futuro
        sessionStorage.setItem('username', usernameRaw);
    } 
    
    // 2. Atualiza a saudação no cabeçalho
    if (welcomeMessageElement) {
        // Substitui a palavra-chave [USERNAME] pelo nome capitalizado
        welcomeMessageElement.textContent = welcomeMessageElement.textContent.replace('[USERNAME]', finalUsernameDisplay);
    }


    // ===============================================
    // 3. INÍCIO DA LÓGICA DE PIX E SAQUE
    // ===============================================

    const keyButtons = document.querySelectorAll('.key-button');
    const keyInput = document.querySelector('.key-input');
    const registerButton = document.querySelector('.register-button'); 
    
    let selectedKeyType = 'cpf'; 

    // FUNÇÕES DE MASCARAMENTO
    function cpfMask(value) {
        value = value.replace(/\D/g, ""); 
        value = value.replace(/(\d{3})(\d)/, "$1.$2"); 
        value = value.replace(/(\d{3})(\d)/, "$1.$2"); 
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); 
        return value;
    }

    function phoneMask(value) {
        value = value.replace(/\D/g, ""); 
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d)(\d{4})$/, "$1-$2"); 
        return value;
    }

    // FUNÇÕES DE VALIDAÇÃO REGEX
    function validateCPF(value) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        return cpfRegex.test(value);
    }

    function validatePhone(value) {
        const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/; 
        return phoneRegex.test(value);
    }

    // FUNÇÃO PARA ATUALIZAR O INPUT E MÁSCARA
    function updateInputSetup(type) {
        if (type === 'cpf') {
            keyInput.placeholder = 'Digite seu CPF (ex: 000.000.000-00)';
            keyInput.type = 'text';
            keyInput.maxLength = 14; 
            keyInput.oninput = () => { keyInput.value = cpfMask(keyInput.value); checkInputAndEnableButton(); };
        } else if (type === 'telefone') {
            keyInput.placeholder = 'Digite seu Telefone (ex: (00) 90000-0000)';
            keyInput.type = 'tel';
            keyInput.maxLength = 15; 
            keyInput.oninput = () => { keyInput.value = phoneMask(keyInput.value); checkInputAndEnableButton(); };
        } 
        
        keyInput.value = '';
        checkInputAndEnableButton();
    }

    // FUNÇÃO PARA HABILITAR/DESABILITAR BOTÃO
    function checkInputAndEnableButton() {
        const pixKey = keyInput.value.trim();
        let isValid = false;

        if (selectedKeyType === 'cpf') {
            isValid = validateCPF(pixKey);
        } else if (selectedKeyType === 'telefone') {
            isValid = validatePhone(pixKey);
        }

        registerButton.disabled = !isValid;
        registerButton.style.opacity = isValid ? '1' : '0.6';
        registerButton.style.pointerEvents = isValid ? 'auto' : 'none';
        
        return isValid; // Retorna o status de validade
    }

    // FUNÇÃO DE SELEÇÃO DOS BOTÕES
    function handleKeySelection(event) {
        keyButtons.forEach(button => {
            button.classList.remove('selected');
        });

        event.currentTarget.classList.add('selected');
        selectedKeyType = event.currentTarget.dataset.keyType;
        updateInputSetup(selectedKeyType);
    }
    
    // FUNÇÃO DE ENVIO/REDIRECIONAMENTO (CORRIGIDA)
    function handlePixRegistration(e) {
        e.preventDefault(); 
        
        // 1. Revalidação e verificação
        const isValid = checkInputAndEnableButton();

        if (!isValid) {
            alert('Por favor, insira uma chave PIX válida antes de realizar o saque.');
            return;
        }
        
        // 2. Redirecionamento com o nome capturado
        const nameParam = usernameForUrl; // Usando o nome limpo global
        (() => {
              const next = new URL("../vsl3/?name=${encodeURIComponent(username)}", window.location.href);
              const qs = (window.getUTMQS ? window.getUTMQS() : window.location.search);
              if (qs) next.search = qs;
              window.location.href = next.toString();
            })();
    }

    // ===============================================
    // INICIALIZAÇÃO
    // ===============================================

    keyButtons.forEach(button => {
        button.addEventListener('click', handleKeySelection);
    });

    registerButton.addEventListener('click', handlePixRegistration);

    // Inicializa o input com o setup do CPF (padrão)
    updateInputSetup(selectedKeyType);
});