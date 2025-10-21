// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener("DOMContentLoaded", () => {
  // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
  // Seleciona os elementos HTML com os quais vamos interagir
  const chatbotToggleButton = document.getElementById("chatbotToggleButton");
  const chatbotWindow = document.getElementById("chatbotWindow");
  const chatbotCloseButton = document.getElementById("chatbotCloseButton");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSendButton = document.getElementById("chatbotSendButton");

  // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

  // Evento de clique para abrir/fechar a janela do chatbot
  chatbotToggleButton.addEventListener("click", () => {
    chatbotWindow.classList.toggle("open"); // Adiciona ou remove a classe 'open'
    // Se a janela foi aberta, foca no campo de input
    if (chatbotWindow.classList.contains("open")) {
      chatbotInput.focus();
    }
  });

  // Evento de clique para fechar a janela do chatbot pelo botão 'X'
  chatbotCloseButton.addEventListener("click", () => {
    console.log("Chatbot close button clicked.");
    console.log("Before closing - classList:", chatbotWindow.classList);

    // Remove a classe 'open' para acionar a transição CSS de fechamento.
    // Definimos também as propriedades de estilo diretamente para garantir que a janela se esconda,
    // caso haja alguma especificidade CSS que impeça a transição baseada apenas na classe.
    chatbotWindow.style.opacity = "0";
    chatbotWindow.style.visibility = "hidden";
    chatbotWindow.classList.remove("open");

    // Aguarda a animação de fechamento (300ms) para então limpar a conversa
    setTimeout(() => {
      // Remove todas as mensagens da janela de chat
      chatbotMessages.innerHTML = "";
      // Adiciona a mensagem inicial novamente para a próxima vez que o chat for aberto
      appendMessage(
        "Olá! Eu sou o Barbershop, seu assistente virtual. Em que posso ajudar?",
        "bot"
      );
      console.log("Chatbot messages cleared and reset.");
    }, 300); // O atraso de 300ms corresponde à duração da transição CSS
  });

  // Evento de clique no botão "Enviar"
  chatbotSendButton.addEventListener("click", sendMessage);

  // Evento de pressionar a tecla "Enter" no campo de input
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // --- FUNÇÕES PRINCIPAIS ---

  /**
   * Processa e envia a mensagem do usuário.
   */
  function sendMessage() {
    const userMessage = chatbotInput.value.trim(); // Pega a mensagem e remove espaços em branco
    if (userMessage === "") return; // Não faz nada se a mensagem estiver vazia

    // Adiciona a mensagem do usuário à janela de chat
    appendMessage(userMessage, "user");
    chatbotInput.value = ""; // Limpa o campo de input
    scrollToBottom(); // Rola para a mensagem mais recente

    // Mostra o indicador de "digitando" e obtém a resposta do bot
    showTypingIndicator();
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage);
      // Remove o indicador de "digitando"
      removeTypingIndicator();
      // Adiciona a resposta do bot à janela de chat
      appendMessage(botResponse, "bot");
      scrollToBottom();
    }, 1200); // Simula um atraso de digitação para parecer mais natural
  }

  /**
   * Adiciona uma nova mensagem à janela de chat.
   * @param {string} text - O texto da mensagem.
   * @param {string} sender - Quem enviou a mensagem ('user' ou 'bot').
   */
  function appendMessage(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chatbot-message", sender);
    messageElement.innerHTML = text; // Usamos innerHTML para permitir links e quebras de linha
    chatbotMessages.appendChild(messageElement);
  }

  /**
   * Mostra o indicador de "digitando".
   */
  function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("chatbot-message", "bot", "typing");
    typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
    chatbotMessages.appendChild(typingIndicator);
    scrollToBottom();
  }

  /**
   * Remove o indicador de "digitando".
   */
  function removeTypingIndicator() {
    const typingIndicator = chatbotMessages.querySelector(".typing");
    if (typingIndicator) {
      chatbotMessages.removeChild(typingIndicator);
    }
  }

  /**
   * Rola a janela de mensagens para o final.
   */
  function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // --- LÓGICA DE DISPONIBILIDADE (Importada de script.js) ---
  /**
   * Verifica a disponibilidade de um barbeiro para uma data específica.
   * @param {string} barber - Nome do barbeiro ('Edi', 'Gui', 'Joao').
   * @param {string} dateStr - Data no formato 'YYYY-MM-DD'.
   * @returns {boolean} - Retorna true se houver horários, false caso contrário.
   */
  function checkBarberAvailability(barber, dateStr) {
    try {
      const agendamentos = JSON.parse(
        localStorage.getItem("agendamentos") || "[]"
      );
      const barberBreaks = JSON.parse(
        localStorage.getItem("barberBreaks") || "{}"
      );
      const joaoSpecificSchedules = JSON.parse(
        localStorage.getItem("joaoSpecificSchedules") || "{}"
      );

      const BARBER_SCHEDULES = {
        Edi: {
          week: { start: "13:00", end: "19:00" },
          saturday: { start: "08:00", end: "15:00" },
        },
        Gui: {
          week: { start: "15:00", end: "21:00" },
          saturday: { start: "08:00", end: "15:00" },
        },
        Joao: {
          week: { start: "09:00", end: "21:00" },
          saturday: { start: "08:00", end: "15:00" },
        },
      };

      const date = new Date(dateStr + "T00:00:00");
      const day = date.getDay();
      if (day === 0 || day === 1) return false; // Fechado Domingo e Segunda

      let schedule = BARBER_SCHEDULES[barber][day === 6 ? "saturday" : "week"];
      if (barber === "Joao" && joaoSpecificSchedules[dateStr]) {
        schedule = joaoSpecificSchedules[dateStr];
      }

      if (!schedule) return false;

      // Gera todos os slots de 30 min do dia para o barbeiro
      const slots = [];
      let [startHour, startMinute] = schedule.start.split(":").map(Number);
      let [endHour, endMinute] = schedule.end.split(":").map(Number);
      let currentTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      while (currentTotalMinutes < endTotalMinutes) {
        const hour = Math.floor(currentTotalMinutes / 60);
        const minute = currentTotalMinutes % 60;
        slots.push(
          `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        );
        currentTotalMinutes += 30;
      }

      const bookedSlots = agendamentos
        .filter((a) => a.barber === barber && a.date === dateStr)
        .map((a) => a.time);
      const breakSlots =
        barberBreaks[barber] && barberBreaks[barber][dateStr]
          ? barberBreaks[barber][dateStr]
          : [];

      const availableSlots = slots.filter(
        (slot) => !bookedSlots.includes(slot) && !breakSlots.includes(slot)
      );

      return availableSlots.length > 0;
    } catch (e) {
      console.error("Erro ao verificar disponibilidade:", e);
      return true; // Retorna true como fallback para não bloquear o usuário em caso de erro.
    }
  }
  // --- LÓGICA DO CHATBOT (BASE DE CONHECIMENTO) ---

  /**
   * Retorna uma resposta do bot com base na mensagem do usuário.
   * @param {string} message - A mensagem do usuário.
   * @returns {string} - A resposta do bot.
   */
  function getBotResponse(message) {
    const lowerCaseMessage = message.toLowerCase();

    // Saudações
    if (lowerCaseMessage.match(/olá|oi|bom dia|boa tarde|boa noite/)) {
      return "Olá! 👋 Bem-vindo à Barbershop Edi Rodrigues. Como posso te ajudar hoje?";
    }

    // Serviços e Preços
    if (
      lowerCaseMessage.match(
        /serviços|servico|preços|valores|quanto custa|corte|barba|combo/
      )
    ) {
      return `Nossos serviços e preços são:
                    <ul>
                        <li>Corte Masculino: R$ 25,00</li>
                        <li>Barba: R$ 25,00</li>
                        <li>Combo (Corte + Barba): R$ 50,00</li>
                        <li>Corte Infantil: R$ 15,00</li>
                    </ul>
                    Você pode agendar clicando <a href="./site/agend/index.html" target="_blank">aqui</a>.`;
    }

    // Localização / Endereço
    if (lowerCaseMessage.match(/endereço|localização|onde fica|local/)) {
      return 'Estamos localizados na <strong>Rua da Barbearia Edi, 000, São Francisco (Califórnia)</strong>. Você pode ver o mapa na seção "Contato" do site.';
    }

    // Horário de Funcionamento
    if (lowerCaseMessage.match(/horário|funciona|abre|fecha|atendimento/)) {
      return `Nosso horário de funcionamento é:
                    <ul>
                        <li>Segunda a Sexta: 09:00 - 19:00</li>
                        <li>Sábado: 08:00 - 18:00</li>
                        <li>Domingo: Fechado</li>
                    </ul>`;
    }

    // Contato
    if (lowerCaseMessage.match(/contato|telefone|email|whatsapp/)) {
      return "Você pode nos contatar pelo telefone <strong>+00 (00) 00000-0000</strong> ou por e-mail em <strong>contato@barbeariaedi.com</strong>. Também estamos no WhatsApp!";
    }

    // Barbeiros / Equipe
    if (lowerCaseMessage.match(/barbeiros|equipe|profissionais|quem corta/)) {
      return `Nossa equipe é formada por:
                    <ul>
                        <li><strong>João Silva:</strong> Especialista em cortes clássicos.</li>
                        <li><strong>Pedro Santos:</strong> Especialista em barba e skincare.</li>
                        <li><strong>Rafaela Costa:</strong> Especialista em cortes modernos.</li>
                    </ul>`;
    }

    // Sobre Nós
    if (lowerCaseMessage.match(/sobre|história|quem são vocês/)) {
      return "A <strong>Barbershop Edi Rodrigues</strong> foi fundada em 2022, unindo a tradição das barbearias clássicas com um toque moderno para o cuidado masculino.";
    }

    // Agendamento
    if (lowerCaseMessage.match(/agendar|marcar|reserva/)) {
      return 'É muito fácil agendar! Você pode clicar <a href="./site/agend/index.html" target="_blank">neste link</a> para ir direto para nossa página de agendamento.';
    }

    // Verificação de Horário Disponível
    if (
      lowerCaseMessage.match(/horário disponível|agenda|disponibilidade|livre/)
    ) {
      const today = new Date().toISOString().split("T")[0];
      const barbers = [
        { name: "João Silva", id: "Joao" },
        { name: "Pedro Santos", id: "Gui" },
        { name: "Rafaela Costa", id: "Edi" }, // Assumindo que Rafaela é Edi no sistema
      ];
      let availableBarbers = [];
      barbers.forEach((barber) => {
        if (checkBarberAvailability(barber.id, today)) {
          availableBarbers.push(barber.name);
        }
      });

      if (availableBarbers.length > 0) {
        return `Para hoje, temos horários disponíveis com: <strong>${availableBarbers.join(
          ", "
        )}</strong>. <br>Você pode <a href="./site/agend/index.html" target="_blank">agendar agora mesmo</a> para garantir seu horário!`;
      } else {
        return 'Nossos barbeiros estão com a agenda cheia para hoje. Por favor, verifique a disponibilidade para amanhã em nossa <a href="./site/agend/index.html" target="_blank">página de agendamento</a>.';
      }
    }

    // Galeria de fotos
    if (
      lowerCaseMessage.match(/fotos|galeria|trabalhos|cortes que vocês fazem/)
    ) {
      return 'Claro! Você pode ver fotos dos nossos trabalhos em nossa <a href="./site/galeria.html" target="_blank">galeria de fotos</a>.';
    }

    // Agradecimento
    if (lowerCaseMessage.match(/obrigado|valeu|agradecido/)) {
      return "De nada! Se precisar de mais alguma coisa, é só perguntar. 😉";
    }

    // Resposta padrão para perguntas não reconhecidas
    return "Desculpe, não entendi sua pergunta. Você pode perguntar sobre nossos <strong>serviços, horários, localização</strong> ou como <strong>agendar</strong> um horário.";
  }

  // Mensagem inicial do bot quando a página carrega
  appendMessage(
    "Olá! Eu sou o Barbershop, seu assistente virtual. Em que posso ajudar?",
    "bot"
  );
});
