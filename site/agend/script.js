document.addEventListener("DOMContentLoaded", () => {
  // Elementos do formulário de agendamento do cliente
  const clientNameInput = document.getElementById("clientName");
  const barberSelect = document.getElementById("barberSelect");
  const cutTypeSelect = document.getElementById("cutType");
  const dateInput = document.getElementById("dateInput");
  const timeSelect = document.getElementById("timeSelect");
  const scheduleButton = document.getElementById("scheduleButton");
  const messageDiv = document.getElementById("message");

  // Botão "Ver Todos os Agendamentos" para clientes
  const showAllAppointmentsClientButton = document.getElementById(
    "showAllAppointmentsClient"
  );

  // Elementos do painel do barbeiro
  const barberModeButton = document.getElementById("barberModeButton");
  const barberPanel = document.getElementById("barberPanel");
  const barberLoginSelect = document.getElementById("barberLoginSelect");
  const breakDateInput = document.getElementById("breakDateInput");
  const breakTimeInput = document.getElementById("breakTimeInput");
  const addBreakButton = document.getElementById("addBreakButton");
  const viewBreaksButton = document.getElementById("viewBreaksButton"); // Agora só mostra pausas
  const deleteBreakButton = document.getElementById("deleteBreakButton"); // Botão para apagar pausas
  const barberPanelMessage = document.getElementById("barberPanelMessage");

  // Elementos para João definir seus horários
  const joaoSchedulePanel = document.getElementById("joaoSchedulePanel");
  const joaoDateInput = document.getElementById("joaoDateInput");
  const joaoStartHour = document.getElementById("joaoStartHour");
  const joaoEndHour = document.getElementById("joaoEndHour");
  const saveJoaoSchedule = document.getElementById("saveJoaoSchedule");
  const joaoScheduleMessage = document.getElementById("joaoScheduleMessage");

  // Botões e mensagens para apagar agendamentos de clientes
  const viewAndSelectAppointmentsButton = document.getElementById(
    "viewAndSelectAppointmentsButton"
  );
  const deleteAppointmentMessage = document.getElementById(
    "deleteAppointmentMessage"
  );

  // Dados dos barbeiros e horários
  const barberPhones = {
    "João Silva": "5511952511928",
    "Pedro Santos": "5511952511928",
    "Rafaela Costa": "5511952511928",
  };

  const BARBER_SCHEDULES = {
    "João Silva": {
      week: { start: "13:00", end: "19:00" }, // Terça a sexta
      saturday: { start: "08:00", end: "15:00" },
    },
    "Pedro Santos": {
      week: { start: "15:00", end: "21:00" }, // Terça a sexta
      saturday: { start: "08:00", end: "15:00" },
    },
    "Rafaela Costa": {
      // João tem horário alternativo que ele define, mas aqui é um fallback/default
      week: { start: "09:00", end: "21:00" }, // Horário da barbearia como default se não houver específico
      saturday: { start: "08:00", end: "15:00" },
    },
  };

  // Horários gerais de funcionamento da barbearia
  const BARBER_SHOP_OPENING_HOURS = {
    start: "09:00",
    end: "21:00",
  };

  // Funções de utilidade para mensagens
  function displayMessage(text, type, element = messageDiv) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = "block";
    setTimeout(() => {
      element.style.display = "none";
      element.textContent = "";
      element.className = "message";
    }, 5000);
  }

  // Função para pegar parâmetros da URL (para preencher o serviço)
  function getUrlParameter(name) {
    name = name.replace(/[[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  // Funções para gerenciar dados no localStorage
  function getStoredData(key, defaultValue = {}) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || JSON.stringify(defaultValue)
      );
    } catch (e) {
      console.error(`Erro ao parsear dados de ${key} do localStorage:`, e);
      return defaultValue;
    }
  }

  function saveStoredData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Carregar pausas e horários alternativos do João ao iniciar
  let barberBreaks = getStoredData("barberBreaks", {});
  let joaoSpecificSchedules = getStoredData("joaoSpecificSchedules", {});

  // Funções de Horário e Disponibilidade
  function generateTimeSlots(start, end, interval = 30) {
    const slots = [];
    let [startHour, startMinute] = start.split(":").map(Number);
    let [endHour, endMinute] = end.split(":").map(Number);

    let currentTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    while (currentTotalMinutes < endTotalMinutes) {
      const hour = Math.floor(currentTotalMinutes / 60);
      const minute = currentTotalMinutes % 60;
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}`;
      slots.push(time);
      currentTotalMinutes += interval;
    }
    return slots;
  }

  function getBarberDaySchedule(barber, dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    if (day === 0 || day === 1) {
      // Domingo (0) ou Segunda (1)
      return null;
    }

    const isSaturday = day === 6;
    let schedule = BARBER_SCHEDULES[barber][isSaturday ? "saturday" : "week"];

    if (barber === "Rafaela Costa" && joaoSpecificSchedules[dateStr]) {
      return joaoSpecificSchedules[dateStr];
    }

    return schedule;
  }

  function isSlotAvailable(barber, dateStr, timeStr) {
    const daySchedule = getBarberDaySchedule(barber, dateStr);

    if (!daySchedule) {
      return false;
    }

    const isWithinBarberHours =
      timeStr >= daySchedule.start && timeStr < daySchedule.end;
    const isWithinShopHours =
      timeStr >= BARBER_SHOP_OPENING_HOURS.start &&
      timeStr < BARBER_SHOP_OPENING_HOURS.end;
    const isDuringBreak =
      barberBreaks[barber] &&
      barberBreaks[barber][dateStr] &&
      barberBreaks[barber][dateStr].includes(timeStr);
    const isBooked = getStoredData("agendamentos", []).some(
      (appt) =>
        appt.barber === barber && appt.date === dateStr && appt.time === timeStr
    );

    return (
      isWithinBarberHours && isWithinShopHours && !isDuringBreak && !isBooked
    );
  }

  function updateAvailableTimes() {
    const selectedBarber = barberSelect.value;
    const selectedDate = dateInput.value;
    timeSelect.innerHTML = '<option value="">-- Selecione uma Hora --</option>';

    if (!selectedBarber || !selectedDate) {
      return;
    }

    const date = new Date(selectedDate + "T00:00:00");
    const day = date.getDay();

    if (day === 0 || day === 1) {
      displayMessage(
        "A barbearia está fechada aos domingos e segundas-feiras.",
        "error"
      );
      return;
    } else {
      messageDiv.style.display = "none";
    }

    const barberSchedule = getBarberDaySchedule(selectedBarber, selectedDate);

    if (!barberSchedule) {
      displayMessage(
        `Nenhum horário de trabalho definido para ${selectedBarber} nesta data.`,
        "error"
      );
      return;
    }

    const candidateTimes = generateTimeSlots(
      barberSchedule.start,
      barberSchedule.end
    );
    const availableSlots = candidateTimes.filter((time) =>
      isSlotAvailable(selectedBarber, selectedDate, time)
    );

    if (availableSlots.length === 0) {
      displayMessage(
        "Nenhum horário disponível para este barbeiro nesta data. Por favor, escolha outro.",
        "error"
      );
      return;
    }

    availableSlots.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      timeSelect.appendChild(option);
    });
  }

  // Função para salvar um agendamento no localStorage
  function saveAppointment(barber, clientName, service, date, time) {
    const stored = getStoredData("agendamentos", []);
    stored.push({ barber, clientName, service, date, time });
    saveStoredData("agendamentos", stored);
  }

  // Função para exibir todos os agendamentos salvos (para cliente e modo barbeiro)
  function showAllAppointments() {
    const stored = getStoredData("agendamentos", []);
    if (stored.length === 0) {
      alert("Nenhum agendamento encontrado.");
      return;
    }

    const list = stored
      .map(
        (a, index) =>
          `${index + 1}. Cliente: ${a.clientName}, Serviço: ${
            a.service
          }, Data: ${a.date} às ${a.time} com ${a.barber}`
      )
      .join("\n\n");
    alert("Agendamentos Registrados:\n\n" + list);
  }

  // Função para exibir apenas as pausas registradas de um barbeiro
  function showBarberBreaks(barber) {
    let breaksList = "";
    if (barberBreaks[barber]) {
      for (const date in barberBreaks[barber]) {
        const sortedBreaks = barberBreaks[barber][date].sort();
        breaksList += `\n${date}: ${sortedBreaks.join(", ")}`;
      }
    }

    if (breaksList) {
      alert(`Pausas de ${barber}:${breaksList}`);
    } else {
      alert(`Nenhuma pausa registrada para ${barber}.`);
    }
  }

  // Função para apagar um agendamento específico
  function deleteAppointment(indexToDelete) {
    let stored = getStoredData("agendamentos", []);
    if (indexToDelete >= 0 && indexToDelete < stored.length) {
      const deleted = stored.splice(indexToDelete, 1); // Remove o item
      saveStoredData("agendamentos", stored); // Salva o array atualizado
      displayMessage(
        `Agendamento de ${deleted[0].clientName} em ${deleted[0].date} às ${deleted[0].time} com ${deleted[0].barber} foi apagado.`,
        "success",
        deleteAppointmentMessage
      );
      updateAvailableTimes(); // Atualiza a lista de horários disponíveis no formulário de agendamento
    } else {
      displayMessage(
        "Número de agendamento inválido.",
        "error",
        deleteAppointmentMessage
      );
    }
  }

  // Função para apagar uma pausa específica
  function deleteBreak(barber, date, time) {
    if (barberBreaks[barber] && barberBreaks[barber][date]) {
      const initialLength = barberBreaks[barber][date].length;
      barberBreaks[barber][date] = barberBreaks[barber][date].filter(
        (bTime) => bTime !== time
      );

      if (barberBreaks[barber][date].length === 0) {
        delete barberBreaks[barber][date]; // Remove a data se não houver mais pausas
      }
      if (Object.keys(barberBreaks[barber]).length === 0) {
        delete barberBreaks[barber]; // Remove o barbeiro se não houver mais datas com pausas
      }
      saveStoredData("barberBreaks", barberBreaks);
      if (
        barberBreaks[barber] &&
        barberBreaks[barber][date] &&
        barberBreaks[barber][date].length < initialLength
      ) {
        displayMessage(
          `Pausa de ${time} para ${barber} em ${date} foi apagada.`,
          "success",
          barberPanelMessage
        );
      } else {
        displayMessage(
          `Pausa ${time} para ${barber} em ${date} não encontrada.`,
          "error",
          barberPanelMessage
        );
      }
      updateAvailableTimes(); // Atualiza a lista de horários disponíveis no formulário de agendamento
    } else {
      displayMessage(
        `Pausa para ${barber} em ${date} não encontrada.`,
        "error",
        barberPanelMessage
      );
    }
  }

  // --- Event Listeners para o formulário de agendamento do cliente ---

  barberSelect.addEventListener("change", updateAvailableTimes);
  dateInput.addEventListener("change", updateAvailableTimes);

  const serviceFromUrl = getUrlParameter("servico");
  if (serviceFromUrl) {
    cutTypeSelect.value = serviceFromUrl;
  }

  scheduleButton.addEventListener("click", () => {
    const clientName = clientNameInput.value.trim();
    const selectedBarber = barberSelect.value;
    const cutType = cutTypeSelect.value;
    const date = dateInput.value;
    const time = timeSelect.value;

    if (!clientName || !selectedBarber || !cutType || !date || !time) {
      displayMessage("Por favor, preencha todos os campos.", "error");
      return;
    }

    if (!isSlotAvailable(selectedBarber, date, time)) {
      displayMessage(
        "Este horário não está disponível para o barbeiro ou data selecionados. Por favor, escolha outro.",
        "error"
      );
      return;
    }

    const phoneNumber = barberPhones[selectedBarber];
    if (phoneNumber) {
      const selectedServiceText =
        cutTypeSelect.options[cutTypeSelect.selectedIndex].text;
      const message = `Olá, ${selectedBarber}! Gostaria de agendar um serviço, *${selectedServiceText}* para ${date} às ${time}. Cliente: *${clientName}*.`;
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      saveAppointment(
        selectedBarber,
        clientName,
        selectedServiceText,
        date,
        time
      );
      displayMessage(
        "Agendamento realizado! Redirecionando para o WhatsApp do barbeiro...",
        "success"
      );

      setTimeout(() => {
        window.open(whatsappLink, "_blank");
      }, 1000);

      clientNameInput.value = "";
      barberSelect.value = "";
      cutTypeSelect.value = "";
      dateInput.value = "";
      timeSelect.innerHTML =
        '<option value="">-- Selecione uma Hora --</option>';
    } else {
      displayMessage("Número de WhatsApp do barbeiro não encontrado.", "error");
    }
  });

  // Event listener para o botão de "Ver Todos os Agendamentos" na tela principal
  if (showAllAppointmentsClientButton) {
    showAllAppointmentsClientButton.addEventListener(
      "click",
      showAllAppointments
    );
  }

  // --- Funcionalidades do Painel do Barbeiro ---

  const ADMIN_PASSWORD = "123"; // Senha simples para demonstração

  barberModeButton.addEventListener("click", () => {
    const password = prompt("Digite a senha do barbeiro:");
    if (password === ADMIN_PASSWORD) {
      barberPanel.classList.toggle("hidden-panel");
      if (!barberPanel.classList.contains("hidden-panel")) {
        joaoSchedulePanel.classList.add("hidden-panel");
        barberLoginSelect.value = "";
      }
    } else {
      alert("Senha incorreta!");
    }
  });

  barberLoginSelect.addEventListener("change", () => {
    const selectedBarber = barberLoginSelect.value;
    if (selectedBarber === "Rafaela Costa") {
      joaoSchedulePanel.classList.remove("hidden-panel");
      const today = new Date().toISOString().split("T")[0];
      joaoDateInput.value = today;
      if (joaoSpecificSchedules[today]) {
        joaoStartHour.value = joaoSpecificSchedules[today].start;
        joaoEndHour.value = joaoSpecificSchedules[today].end;
      } else {
        joaoStartHour.value = "";
        joaoEndHour.value = "";
      }
    } else {
      joaoSchedulePanel.classList.add("hidden-panel");
    }
  });

  // Adicionar Pausa
  addBreakButton.addEventListener("click", () => {
    const selectedBarber = barberLoginSelect.value;
    const breakDate = breakDateInput.value;
    const breakTime = breakTimeInput.value;

    if (!selectedBarber || !breakDate || !breakTime) {
      displayMessage(
        "Por favor, selecione o barbeiro, a data e a hora da pausa.",
        "error",
        barberPanelMessage
      );
      return;
    }

    if (!barberBreaks[selectedBarber]) {
      barberBreaks[selectedBarber] = {};
    }
    if (!barberBreaks[selectedBarber][breakDate]) {
      barberBreaks[selectedBarber][breakDate] = [];
    }

    if (barberBreaks[selectedBarber][breakDate].includes(breakTime)) {
      displayMessage(
        "Esta pausa já foi adicionada.",
        "error",
        barberPanelMessage
      );
      return;
    }

    barberBreaks[selectedBarber][breakDate].push(breakTime);
    saveStoredData("barberBreaks", barberBreaks);
    displayMessage(
      `Pausa de ${breakTime} para ${selectedBarber} em ${breakDate} adicionada.`,
      "success",
      barberPanelMessage
    );
    updateAvailableTimes();
  });

  // Ver Pausas (apenas pausas)
  viewBreaksButton.addEventListener("click", () => {
    const selectedBarber = barberLoginSelect.value;
    if (!selectedBarber) {
      displayMessage(
        "Por favor, selecione um barbeiro para ver as pausas.",
        "error",
        barberPanelMessage
      );
      return;
    }
    showBarberBreaks(selectedBarber); // Chama a função para mostrar APENAS as pausas
  });

  // Apagar Pausa
  deleteBreakButton.addEventListener("click", () => {
    const selectedBarber = barberLoginSelect.value;
    const dateToDelete = breakDateInput.value;
    const timeToDelete = breakTimeInput.value;

    if (!selectedBarber || !dateToDelete || !timeToDelete) {
      displayMessage(
        "Selecione o barbeiro, a data e a hora da pausa para apagar.",
        "error",
        barberPanelMessage
      );
      return;
    }

    // Pergunta ao usuário se ele tem certeza antes de apagar
    if (
      confirm(
        `Tem certeza que deseja apagar a pausa de ${timeToDelete} em ${dateToDelete} para ${selectedBarber}?`
      )
    ) {
      deleteBreak(selectedBarber, dateToDelete, timeToDelete);
    }
  });

  saveJoaoSchedule.addEventListener("click", () => {
    const date = joaoDateInput.value;
    const start = joaoStartHour.value;
    const end = joaoEndHour.value;

    if (!date || !start || !end) {
      displayMessage(
        "Por favor, preencha a data, hora de início e hora de fim para João.",
        "error",
        joaoScheduleMessage
      );
      return;
    }

    if (start >= end) {
      displayMessage(
        "A hora de início deve ser anterior à hora de fim.",
        "error",
        joaoScheduleMessage
      );
      return;
    }

    joaoSpecificSchedules[date] = { start, end };
    saveStoredData("joaoSpecificSchedules", joaoSpecificSchedules);
    displayMessage(
      `Horário de João para ${date} salvo: ${start} - ${end}`,
      "success",
      joaoScheduleMessage
    );
    updateAvailableTimes();
  });

  // Ver e Apagar Agendamentos de Clientes (no modo barbeiro)
  viewAndSelectAppointmentsButton.addEventListener("click", () => {
    const storedAppointments = getStoredData("agendamentos", []);
    if (storedAppointments.length === 0) {
      displayMessage(
        "Nenhum agendamento para apagar.",
        "error",
        deleteAppointmentMessage
      );
      return;
    }

    // Cria uma lista numerada para o usuário escolher
    const appointmentList = storedAppointments
      .map(
        (a, index) =>
          `${index + 1}. Cliente: ${a.clientName} - ${a.service} - ${
            a.date
          } às ${a.time} com ${a.barber}`
      )
      .join("\n");

    const input = prompt(
      `Digite o número do agendamento que deseja apagar:\n\n${appointmentList}\n\nDigite 'cancelar' para sair.`
    );

    if (input === null || input.toLowerCase() === "cancelar") {
      displayMessage(
        "Operação de exclusão cancelada.",
        "error",
        deleteAppointmentMessage
      );
      return;
    }

    const indexToDelete = parseInt(input) - 1; // Ajusta para índice base 0

    if (
      isNaN(indexToDelete) ||
      indexToDelete < 0 ||
      indexToDelete >= storedAppointments.length
    ) {
      displayMessage(
        "Número de agendamento inválido. Tente novamente.",
        "error",
        deleteAppointmentMessage
      );
      return;
    }

    // Confirmação final antes de apagar
    const confirmDelete = confirm(
      `Tem certeza que deseja apagar o agendamento:\n${storedAppointments[indexToDelete].clientName} - ${storedAppointments[indexToDelete].service} - ${storedAppointments[indexToDelete].date} às ${storedAppointments[indexToDelete].time}?`
    );

    if (confirmDelete) {
      deleteAppointment(indexToDelete);
    } else {
      displayMessage(
        "Exclusão de agendamento cancelada.",
        "error",
        deleteAppointmentMessage
      );
    }
  });

  updateAvailableTimes();
});
