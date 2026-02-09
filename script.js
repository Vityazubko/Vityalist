const modal = document.getElementById("level-modal");
const openButtons = [
  document.getElementById("open-form"),
  document.getElementById("open-form-secondary"),
];
const closeButton = document.getElementById("close-form");
const form = document.getElementById("level-form");
const toast = document.getElementById("admin-toast");
const toastText = document.getElementById("admin-toast-text");
const approveButton = document.getElementById("approve-level");
const rejectButton = document.getElementById("reject-level");
const levelsGrid = document.getElementById("levels-grid");
const pendingGrid = document.getElementById("pending-grid");

let pendingSubmission = null;

const openModal = () => {
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
};

openButtons.forEach((button) => {
  if (button) {
    button.addEventListener("click", openModal);
  }
});

closeButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

const showToast = (message) => {
  toastText.textContent = message;
  toast.classList.add("show");
};

const hideToast = () => {
  toast.classList.remove("show");
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  pendingSubmission = {
    id: data.get("levelId").trim(),
    name: data.get("levelName").trim(),
    music: data.get("music").trim(),
    creator: data.get("creator").trim(),
    verifier: data.get("verifier").trim(),
    description: data.get("description").trim(),
  };

  showToast(`Надійшов рівень "${pendingSubmission.name}". Прийняти?`);
  form.reset();
  closeModal();
});

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

approveButton.addEventListener("click", () => {
  if (!pendingSubmission) {
    return;
  }

  const targetGrid = pendingSubmission.verifier ? levelsGrid : pendingGrid;
  const card = pendingSubmission.verifier
    ? createLevelCard(pendingSubmission)
    : createPendingCard(pendingSubmission);

  targetGrid.prepend(card);
  pendingSubmission = null;
  hideToast();
});

rejectButton.addEventListener("click", () => {
  pendingSubmission = null;
  hideToast();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});
