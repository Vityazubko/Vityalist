const levelModal = document.getElementById("level-modal");
const authModal = document.getElementById("auth-modal");
const openButtons = [
  document.getElementById("open-form"),
  document.getElementById("open-form-secondary"),
];
const closeButton = document.getElementById("close-form");
const openAuthButton = document.getElementById("open-auth");
const closeAuthButton = document.getElementById("close-auth");
const form = document.getElementById("level-form");
const authForm = document.getElementById("auth-form");
const toast = document.getElementById("admin-toast");
const toastText = document.getElementById("admin-toast-text");
const approveButton = document.getElementById("approve-level");
const rejectButton = document.getElementById("reject-level");
const levelsGrid = document.getElementById("levels-grid");
const pendingGrid = document.getElementById("pending-grid");
const messageList = document.getElementById("message-list");
const requestDetails = document.getElementById("request-details");

const ADMIN_USERNAME = "Vityadmin";
const submissions = [];
let pendingSubmission = null;
let selectedSubmissionId = null;
let currentUser = null;

const isAdmin = () => currentUser?.username === ADMIN_USERNAME;

const openModal = (modal) => {
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = (modal) => {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
};

openButtons.forEach((button) => {
  if (button) {
    button.addEventListener("click", () => {
      if (!currentUser) {
        openModal(authModal);
        return;
      }
      openModal(levelModal);
    });
  }
});

openAuthButton.addEventListener("click", () => openModal(authModal));
closeButton.addEventListener("click", () => closeModal(levelModal));
closeAuthButton.addEventListener("click", () => closeModal(authModal));

levelModal.addEventListener("click", (event) => {
  if (event.target === levelModal) {
    closeModal(levelModal);
  }
});

authModal.addEventListener("click", (event) => {
  if (event.target === authModal) {
    closeModal(authModal);
  }
});

const showToast = (message) => {
  toastText.textContent = message;
  toast.classList.add("show");
};

const hideToast = () => {
  toast.classList.remove("show");
};

const updateToastActions = () => {
  if (isAdmin()) {
    toast.classList.remove("readonly");
    approveButton.disabled = false;
    rejectButton.disabled = false;
    return;
  }
  toast.classList.add("readonly");
  approveButton.disabled = true;
  rejectButton.disabled = true;
};

const createLevelCard = (submission) => {
  const card = document.createElement("article");
  card.className = "level-card";
  card.innerHTML = `
    <div class="level-header">
      <span>ID: ${submission.id}</span>
      <span class="status">Додано</span>
    </div>
    <h3>${submission.name}</h3>
    <p>${submission.description || "Складність: максимальна. Деталі додадуться пізніше."}</p>
    <div class="meta">
      <span>Музика: ${submission.music}</span>
      <span>Автор: ${submission.creator}</span>
      <span>Верифікатор: ${submission.verifier || "Немає"}</span>
    </div>
  `;
  return card;
};

const createPendingCard = (submission) => {
  const card = document.createElement("article");
  card.className = "pending-card";
  card.innerHTML = `
    <div class="pending-header">
      <span>ID: ${submission.id}</span>
      <span class="status">Очікує</span>
    </div>
    <h3>${submission.name}</h3>
    <p>${submission.description || "Очікує на першого проходження."}</p>
    <div class="meta">
      <span>Музика: ${submission.music}</span>
      <span>Автор: ${submission.creator}</span>
      <span>Верифікатор: ${submission.verifier || "Немає"}</span>
    </div>
  `;
  return card;
};

const renderMessages = () => {
  messageList.innerHTML = "";
  if (!isAdmin()) {
    const locked = document.createElement("div");
    locked.className = "message placeholder";
    locked.innerHTML = `
      <strong>Доступ обмежено</strong>
      <p>Увійдіть як ${ADMIN_USERNAME}, щоб бачити повідомлення.</p>
    `;
    messageList.append(locked);
    requestDetails.innerHTML = `<p class="muted">Адмін-панель доступна тільки для Vityadmin.</p>`;
    return;
  }

  if (!submissions.length) {
    const empty = document.createElement("div");
    empty.className = "message placeholder";
    empty.innerHTML = `
      <strong>Очікування запитів</strong>
      <p>Коли хтось відправить рівень, він зʼявиться тут.</p>
    `;
    messageList.append(empty);
    requestDetails.innerHTML = `<p class="muted">Вибери запит зі списку, щоб редагувати дані.</p>`;
    return;
  }

  submissions.forEach((submission) => {
    const message = document.createElement("button");
    message.type = "button";
    message.className = `message ${submission.id === selectedSubmissionId ? "active" : ""}`;
    message.innerHTML = `
      <strong>${submission.name}</strong>
      <span>ID: ${submission.id}</span>
      <span class="small">Автор: ${submission.creator}</span>
      <span class="badge">${submission.status}</span>
    `;
    message.addEventListener("click", () => {
      selectedSubmissionId = submission.id;
      renderMessages();
      renderRequestDetails(submission);
    });
    messageList.append(message);
  });
};

const updateSubmission = (submission, updates) => {
  Object.assign(submission, updates);
  renderMessages();
};

const renderRequestDetails = (submission) => {
  requestDetails.innerHTML = `
    <form id="admin-edit-form">
      <label>
        ID рівня
        <input type="text" name="levelId" value="${submission.id}" required />
      </label>
      <label>
        Назва рівня
        <input type="text" name="levelName" value="${submission.name}" required />
      </label>
      <label>
        Музика
        <input type="text" name="music" value="${submission.music}" required />
      </label>
      <label>
        Автор
        <input type="text" name="creator" value="${submission.creator}" required />
      </label>
      <label>
        Верифікатор
        <input type="text" name="verifier" value="${submission.verifier}" />
      </label>
      <label>
        Опис
        <textarea name="description" rows="3">${submission.description}</textarea>
      </label>
      <label>
        Розміщення
        <select name="slot">
          <option value="pending">Pending List</option>
          <option value="1">Slot 01</option>
          <option value="2">Slot 02</option>
          <option value="3">Slot 03</option>
          <option value="4">Slot 04</option>
          <option value="5">Slot 05</option>
          <option value="6">Slot 06</option>
        </select>
      </label>
      <p class="muted">Без верифікатора рівень потрапить у Pending List.</p>
      <div class="admin-actions">
        <button class="ghost" type="button" data-action="reject">Відхилити</button>
        <button class="primary" type="submit">Підтвердити</button>
      </div>
    </form>
  `;

  const editForm = document.getElementById("admin-edit-form");
  editForm.slot.value = submission.slot ?? "pending";
  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(editForm);
    const updates = {
      id: data.get("levelId").trim(),
      name: data.get("levelName").trim(),
      music: data.get("music").trim(),
      creator: data.get("creator").trim(),
      verifier: data.get("verifier").trim(),
      description: data.get("description").trim(),
      slot: data.get("slot"),
    };
    updateSubmission(submission, updates);
    approveSubmission(submission);
  });

  editForm.querySelector("[data-action='reject']").addEventListener("click", () => {
    submission.status = "Відхилено";
    renderMessages();
    requestDetails.innerHTML = `<p class="muted">Запит відхилено.</p>`;
  });
};

const placeInSlot = (submission, slot) => {
  const placeholder = levelsGrid.querySelector(`[data-slot="${slot}"]`);
  if (placeholder) {
    placeholder.replaceWith(createLevelCard(submission));
  } else {
    levelsGrid.prepend(createLevelCard(submission));
  }
};

const approveSubmission = (submission) => {
  if (!submission.verifier) {
    pendingGrid.prepend(createPendingCard(submission));
    submission.status = "Pending";
  } else if (submission.slot && submission.slot !== "pending") {
    placeInSlot(submission, submission.slot);
    submission.status = `Розміщено: Slot ${submission.slot}`;
  } else {
    levelsGrid.prepend(createLevelCard(submission));
    submission.status = "Додано";
  }
  selectedSubmissionId = null;
  renderMessages();
  requestDetails.innerHTML = `<p class="muted">Рівень додано. Можеш обрати інший запит.</p>`;
};

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(authForm);
  currentUser = {
    username: data.get("username").trim(),
    email: data.get("email").trim(),
  };
  openAuthButton.textContent = currentUser.username;
  renderMessages();
  updateToastActions();
  closeModal(authModal);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentUser) {
    openModal(authModal);
    return;
  }

  const data = new FormData(form);
  pendingSubmission = {
    id: data.get("levelId").trim(),
    name: data.get("levelName").trim(),
    music: data.get("music").trim(),
    creator: data.get("creator").trim(),
    verifier: data.get("verifier").trim(),
    description: data.get("description").trim(),
    status: "Новий",
    slot: "pending",
  };

  submissions.unshift(pendingSubmission);
  renderMessages();

  if (isAdmin()) {
    showToast(`Надійшов рівень "${pendingSubmission.name}". Перевір у повідомленнях.`);
  } else {
    showToast(`Запит "${pendingSubmission.name}" відправлено Vityadmin.`);
  }
  updateToastActions();

  form.reset();
  closeModal(levelModal);
});

approveButton.addEventListener("click", () => {
  if (!pendingSubmission || !isAdmin()) {
    return;
  }

  selectedSubmissionId = pendingSubmission.id;
  renderMessages();
  renderRequestDetails(pendingSubmission);
  hideToast();
});

rejectButton.addEventListener("click", () => {
  if (!pendingSubmission || !isAdmin()) {
    return;
  }
  pendingSubmission.status = "Відхилено";
  renderMessages();
  pendingSubmission = null;
  hideToast();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(levelModal);
    closeModal(authModal);
  }
});

renderMessages();
updateToastActions();
