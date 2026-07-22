const tabs = document.querySelectorAll(".nav-tab");
const views = document.querySelectorAll(".view");
const refreshBtn = document.querySelector("#refreshBtn");
const dailyQuote = document.querySelector("#dailyQuote");
const promptButtons = document.querySelectorAll(".prompt-bank button");
const coachInput = document.querySelector("#coachInput");
const coachSend = document.querySelector("#coachSend");
const userQuestion = document.querySelector("#userQuestion");
const coachAnswer = document.querySelector("#coachAnswer");
const bookGate = document.querySelector("#bookGate");
const openBook = document.querySelector("#openBook");
const appShell = document.querySelector("#appShell");

const quotes = [
  "真正的顺势，不是等待命运安排，而是看懂自己此刻该用哪一种力。",
  "今日不必向外证明太多，先把内在的秩序重新排好。",
  "你以为自己缺少机会，其实更需要一个能长期承接机会的节奏。",
  "越是想快速确定答案，越要给判断留一夜的时间。",
  "命盘不是限制你的边界，而是提醒你哪条路更省力。"
];

function enterApp() {
  openBook.classList.add("is-opening");

  window.setTimeout(() => {
    bookGate.classList.add("opened");
    appShell.classList.add("ready");
    appShell.removeAttribute("aria-hidden");
    document.body.classList.remove("locked");
  }, 640);
}

openBook.addEventListener("click", enterApp);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    views.forEach((view) => view.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}`).classList.add("active");
  });
});

refreshBtn.addEventListener("click", () => {
  const current = dailyQuote.textContent;
  const next = quotes.find((quote) => quote !== current) || quotes[0];
  dailyQuote.textContent = next;
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    coachInput.value = button.textContent;
    coachInput.focus();
  });
});

function answerQuestion() {
  const question = coachInput.value.trim();
  if (!question) return;

  userQuestion.classList.remove("hidden");
  coachAnswer.classList.remove("hidden");
  userQuestion.querySelector("p").textContent = question;
  coachAnswer.querySelector("p").textContent =
    "从命盘教练视角看，这个问题先不要急着判断吉凶。你当前更适合把选择拆成两个层面：一是它是否符合你的长期秩序，二是它会不会放大你的内耗模式。今天的建议是先写下最担心的三件事，再标出其中唯一能在本周推进的一步。";
  coachInput.value = "";
}

coachSend.addEventListener("click", answerQuestion);
coachInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") answerQuestion();
});

const canvas = document.querySelector("#skyCanvas");
const ctx = canvas.getContext("2d");
let stars = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: Math.min(110, Math.floor(window.innerWidth / 9)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.4 + 0.25,
    a: Math.random() * 0.55 + 0.1,
    v: Math.random() * 0.14 + 0.03
  }));
}

function drawSky() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.strokeStyle = "rgba(215, 181, 109, 0.045)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.arc(window.innerWidth * 0.72, window.innerHeight * 0.22, 90 + i * 48, 0, Math.PI * 2);
    ctx.stroke();
  }

  stars.forEach((star) => {
    star.a += star.v * 0.01;
    const alpha = 0.18 + Math.abs(Math.sin(star.a)) * 0.5;
    ctx.beginPath();
    ctx.fillStyle = `rgba(215, 181, 109, ${alpha})`;
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(drawSky);
}

resizeCanvas();
drawSky();
window.addEventListener("resize", resizeCanvas);
