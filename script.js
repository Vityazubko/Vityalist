const levelModal = document.getElementById("level-modal");
const authModal = document.getElementById("auth-modal");
const openButtons = [
  document.getElementById("open-form"),
  document.getElementById("open-form-secondary"),
];
const closeButton = document.getElementById("close-form");
const openAuthButton = document.getElementById("open-auth");
const openRegisterButton = document.getElementById("open-register");
const closeAuthButton = document.getElementById("close-auth");
const form = document.getElementById("level-form");
const registerForm = document.getElementById("auth-register-form");
const loginForm = document.getElementById("auth-login-form");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const authError = document.getElementById("auth-error");
const toast = document.getElementById("admin-toast");
const toastText = document.getElementById("admin-toast-text");
const approveButton = document.getElementById("approve-level");
const rejectButton = document.getElementById("reject-level");
const levelsGrid = document.getElementById("levels-grid");
const pendingGrid = document.getElementById("pending-grid");
const messageList = document.getElementById("message-list");
const requestDetails = document.getElementById("request-details");

const ADMIN_USERNAME = "Vityadmin";
const ADMIN_PASSWORD = "Secrets";
const STORAGE_KEYS = {
  users: "vityalist_users",
  submissions: "vityalist_submissions",
};

const loadUsers = () => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
  const hasAdmin = stored.some((user) => user.username === ADMIN_USERNAME);
  if (!hasAdmin) {
    stored.push({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      email: "admin@vityalist.local",
    });
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(stored));
  }
  return stored;
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
};

const loadSubmissions = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.submissions) || "[]");

const saveSubmissions = (submissions) => {
  localStorage.setItem(STORAGE_KEYS.submissions, JSON.stringify(submissions));
};

const submissions = loadSubmissions();
const users = loadUsers();
let pendingSubmission = null;
let selectedSubmissionId = null;
let currentUser = null;

const isAdmin = () => currentUser?.username === ADMIN_USERNAME;

const setAuthMode = (mode) => {
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authTab === mode);
  });
  registerForm.classList.toggle("hidden", mode !== "register");
  loginForm.classList.toggle("hidden", mode !== "login");
  authError.textContent = "";
};

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

openAuthButton.addEventListener("click", () => {
  setAuthMode("login");
  openModal(authModal);
});
openRegisterButton.addEventListener("click", () => {
  setAuthMode("register");
  openModal(authModal);
});
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

const slotTemplates = new Map();
document.querySelectorAll(".level-card[data-slot]").forEach((slot) => {
  slotTemplates.set(slot.dataset.slot, slot.innerHTML);
});

const resetSlots = () => {
  document.querySelectorAll(".level-card[data-slot]").forEach((slot) => {
    const template = slotTemplates.get(slot.dataset.slot);
    if (template) {
      slot.innerHTML = template;
      slot.className = "level-card placeholder";
    }
  });
};

const levelContent = (submission) => `
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

const createLevelCard = (submission) => {
  const card = document.createElement("article");
  card.className = "level-card";
  card.dataset.dynamic = "true";
  card.innerHTML = levelContent(submission);
  return card;
};

const createPendingCard = (submission) => {
  const card = document.createElement("article");
  card.className = "pending-card";
  card.dataset.dynamic = "true";
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

const renderStoredLevels = () => {
  resetSlots();
  document.querySelectorAll(".level-card[data-dynamic='true']").forEach((card) => {
    card.remove();
  });
  document.querySelectorAll(".pending-card[data-dynamic='true']").forEach((card) => {
    card.remove();
  });

  submissions
    .filter((submission) => submission.approved)
    .forEach((submission) => {
      if (submission.placement === "pending") {
        pendingGrid.prepend(createPendingCard(submission));
        return;
      }

      if (submission.placement) {
        const slot = document.querySelector(
          `.level-card[data-slot="${submission.placement}"]`
        );
        if (slot) {
          slot.className = "level-card filled";
          slot.innerHTML = levelContent(submission);
          return;
        }
      }

      levelsGrid.prepend(createLevelCard(submission));
    });
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
  saveSubmissions(submissions);
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

const approveSubmission = (submission) => {
  submission.approved = true;
  submission.placement = submission.slot !== "pending" ? submission.slot : "pending";
  submission.status =
    submission.placement === "pending"
      ? "Pending"
      : `Розміщено: Slot ${submission.placement}`;
  saveSubmissions(submissions);
  renderStoredLevels();
  selectedSubmissionId = null;
  renderMessages();
  requestDetails.innerHTML = `<p class="muted">Рівень додано. Можеш обрати інший запит.</p>`;
};

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(registerForm);
  const username = data.get("username").trim();
  const password = data.get("password").trim();
  const email = data.get("email").trim();
  if (users.some((user) => user.username === username)) {
    authError.textContent = "Цей нікнейм вже зайнятий.";
    return;
  }
  users.push({ username, password, email });
  saveUsers(users);
  authError.textContent = "Акаунт створено. Тепер увійдіть.";
  registerForm.reset();
  setAuthMode("login");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = data.get("username").trim();
  const password = data.get("password").trim();
  const user = users.find(
    (entry) => entry.username === username && entry.password === password
  );
  if (!user) {
    authError.textContent = "Невірний логін або пароль.";
    return;
  }
  currentUser = { username: user.username, email: user.email };
  openAuthButton.textContent = currentUser.username;
  renderMessages();
  updateToastActions();
  authError.textContent = "";
  loginForm.reset();
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
    approved: false,
    placement: null,
  };

  submissions.unshift(pendingSubmission);
  saveSubmissions(submissions);
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
  saveSubmissions(submissions);
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
renderStoredLevels();
updateToastActions();
setAuthMode("register");
