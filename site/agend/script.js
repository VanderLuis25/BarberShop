document.addEventListener('DOMContentLoaded', () => {
    const barberSelect = document.getElementById('barberSelect');
    const cutTypeInput = document.getElementById('cutType');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const scheduleButton = document.getElementById('scheduleButton');
    const messageDiv = document.getElementById('message');

    // Função para exibir mensagens ao usuário
    function displayMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`; // Adiciona classes para estilização (success/error)
        messageDiv.style.display = 'block'; // Mostra a mensagem
    }

    // Oculta a mensagem após alguns segundos
    function hideMessage() {
        setTimeout(() => {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000); // 5 segundos
    }

    // Event listener para o botão de agendar
    scheduleButton.addEventListener('click', () => {
        const selectedBarber = barberSelect.value;
        const cutType = cutTypeInput.value.trim();
        const date = dateInput.value;
        const time = timeInput.value;

        // Validação básica dos campos
        if (!selectedBarber) {
            displayMessage('Por favor, selecione um barbeiro.', 'error');
            hideMessage();
            return;
        }
        if (!cutType) {
            displayMessage('Por favor, informe o tipo de corte.', 'error');
            hideMessage();
            return;
        }
        if (!date) {
            displayMessage('Por favor, selecione a data do corte.', 'error');
            hideMessage();
            return;
        }
        if (!time) {
            displayMessage('Por favor, selecione a hora do corte.', 'error');
            hideMessage();
            return;
        }

        
        const appointmentData = {
            barber: selectedBarber,
            cutType: cutType,
            date: date,
            time: time
        };
        const barberPhones = {
            'Luis': '5511952511928', 
            'Janielson': '5511947857728',
            'barber3': '5511952511928'
        };
        const phoneNumber = barberPhones[selectedBarber];
        if (phoneNumber) {
            const message = `Olá, ${selectedBarber}! Gostaria de agendar um corte ${cutType} para ${date} às ${time}. Cliente: [Seu Nome - opcional].`;
            const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappLink, '_blank');
            displayMessage('Redirecionando para o WhatsApp do barbeiro...', 'success');
            hideMessage();
        } else {
            displayMessage('Número de WhatsApp do barbeiro não encontrado.', 'error');
            hideMessage();
        }
    });
});