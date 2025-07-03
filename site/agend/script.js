// script.js

document.addEventListener('DOMContentLoaded', () => {
  const clientNameInput = document.getElementById('clientName');
  const barberSelect = document.getElementById('barberSelect');
  const cutTypeSelect = document.getElementById('cutType');
  const dateInput = document.getElementById('dateInput');
  const timeInput = document.getElementById('timeInput');
  const scheduleButton = document.getElementById('scheduleButton');
  const messageDiv = document.getElementById('message');

  const barberPhones = {
    'Luis': '5511952511928',
    'Janielson': '5511947857728',
    'barber3': '5511952511928'
  };

  const barberWorkingHours = {
    'Luis': {
      week: { start: '13:00', end: '19:00' },
      saturday: { start: '08:00', end: '15:00' }
    },
    'Janielson': {
      week: { start: '15:00', end: '21:00' },
      saturday: { start: '08:00', end: '15:00' }
    },
    'barber3': {
      week: { start: '00:00', end: '23:59' },
      saturday: { start: '08:00', end: '15:00' }
    }
  };

  const joaoHorarios = {
    '2025-07-04': ['10:00', '10:30', '13:00', '13:30']
  };

  const barbeiroPausas = {
    'Luis': ['15:00'],
    'Janielson': ['17:00'],
    'barber3': []
  };

  function displayMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }

  function hideMessage() {
    setTimeout(() => {
      messageDiv.style.display = 'none';
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 5000);
  }

  function getUrlParameter(name) {
    name = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  const serviceFromUrl = getUrlParameter('servico');
  if (serviceFromUrl) {
    cutTypeSelect.value = serviceFromUrl;
  }

  function isWithinWorkingHours(barber, dateStr, timeStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    if (day === 0 || day === 1) return false;

    const isSaturday = day === 6;
    const workHours = barberWorkingHours[barber][isSaturday ? 'saturday' : 'week'];

    if (barber === 'barber3') {
      const horariosJoao = joaoHorarios[dateStr] || [];
      return horariosJoao.includes(timeStr);
    }

    return timeStr >= workHours.start && timeStr <= workHours.end;
  }

  function isInBreak(barber, timeStr) {
    return barbeiroPausas[barber].includes(timeStr);
  }

  function saveAppointment(barber, clientName, service, date, time) {
    const stored = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    stored.push({ barber, clientName, service, date, time });
    localStorage.setItem('agendamentos', JSON.stringify(stored));
  }

  function isSlotTaken(barber, date, time) {
    const stored = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    return stored.some(appt => appt.barber === barber && appt.date === date && appt.time === time);
  }

  function suggestAnotherBarber(date, time) {
    for (const barber in barberWorkingHours) {
      if (isWithinWorkingHours(barber, date, time) && !isInBreak(barber, time) && !isSlotTaken(barber, date, time)) {
        return barber;
      }
    }
    return null;
  }

  function showAllAppointments() {
    const stored = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    if (stored.length === 0) {
      alert('Nenhum agendamento encontrado.');
      return;
    }

    const list = stored.map(a => `${a.clientName} - ${a.service} - ${a.date} às ${a.time} com ${a.barber}`).join('\n');
    alert(list);
  }

  // Botão opcional para visualizar agendamentos
  const viewButton = document.createElement('button');
  viewButton.textContent = 'Ver Agendamentos';
  viewButton.style.marginTop = '10px';
  viewButton.addEventListener('click', showAllAppointments);
  document.querySelector('.container').appendChild(viewButton);

  scheduleButton.addEventListener('click', () => {
    const clientName = clientNameInput.value.trim();
    const selectedBarber = barberSelect.value;
    const cutType = cutTypeSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;

    if (!clientName || !selectedBarber || !cutType || !date || !time) {
      displayMessage('Por favor, preencha todos os campos.', 'error');
      hideMessage();
      return;
    }

    if (!isWithinWorkingHours(selectedBarber, date, time)) {
      const sugestao = suggestAnotherBarber(date, time);
      if (sugestao) {
        const nomeSugestao = {
          'Luis': 'Edi',
          'Janielson': 'Gui',
          'barber3': 'João'
        }[sugestao];
        displayMessage(`Horário indisponível para o barbeiro selecionado. Sugerimos agendar com ${nomeSugestao}.`, 'error');
      } else {
        displayMessage('Nenhum barbeiro disponível neste horário.', 'error');
      }
      hideMessage();
      return;
    }

    if (isInBreak(selectedBarber, time)) {
      displayMessage('Horário indisponível. O barbeiro está em pausa.', 'error');
      hideMessage();
      return;
    }

    if (isSlotTaken(selectedBarber, date, time)) {
      displayMessage('Horário já agendado com este barbeiro. Escolha outro horário.', 'error');
      hideMessage();
      return;
    }

    const phoneNumber = barberPhones[selectedBarber];
    if (phoneNumber) {
      const selectedServiceText = cutTypeSelect.options[cutTypeSelect.selectedIndex].text;
      const message = `Olá, ${selectedBarber}! Gostaria de agendar um serviço, ${selectedServiceText} para ${date} às ${time}. Cliente: ${clientName}.`;
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappLink, '_blank');
      saveAppointment(selectedBarber, clientName, selectedServiceText, date, time);
      displayMessage('Redirecionando para o WhatsApp do barbeiro...', 'success');
      hideMessage();
    } else {
      displayMessage('Número de WhatsApp do barbeiro não encontrado.', 'error');
      hideMessage();
    }
  });
});
