document.addEventListener('DOMContentLoaded', () => {
  const clientNameInput = document.getElementById('clientName'); // campo cliente 
  const barberSelect = document.getElementById('barberSelect');
  const cutTypeSelect = document.getElementById('cutType');
  const dateInput = document.getElementById('dateInput');
  const timeInput = document.getElementById('timeInput');
  const scheduleButton = document.getElementById('scheduleButton');
  const messageDiv = document.getElementById('message');

  // exibir mensagem de campo sem preencher 
  function displayMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }

  // tempo da mensagem 
  function hideMessage() {
    setTimeout(() => {
      messageDiv.style.display = 'none';
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 5000);
  }

  //função de parqametro para extrair da section a opção que o cliente clicar, vem da URL
  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  // para o tipo de corte 
  const serviceFromUrl = getUrlParameter('servico');
  if (serviceFromUrl) {
    cutTypeSelect.value = serviceFromUrl;
  }

  // Event listener for the schedule button
  scheduleButton.addEventListener('click', () => {
    const clientName = clientNameInput.value.trim(); //nome do cliente 
    const selectedBarber = barberSelect.value;
    const cutType = cutTypeSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;

    // validação 
    if (!clientName) { // para o nome no cliente 
      displayMessage('Por favor, informe seu nome.', 'error');
      hideMessage();
      return;
    }
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

    // WhatsApp dos barbeiros 
    const barberPhones = {
      'Luis': '5511952511928',
      'Janielson': '5511947857728',
      'barber3': '5511952511928'
    };

    const phoneNumber = barberPhones[selectedBarber];
    if (phoneNumber) {
      const selectedServiceText = cutTypeSelect.options[cutTypeSelect.selectedIndex].text;
      // mensagem que vai aparecer para o barbeiro selecionado .
      const message = `Olá, ${selectedBarber}! Gostaria de agendar um serviço, ${selectedServiceText} para ${date} às ${time}. Cliente: ${clientName}.`;
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