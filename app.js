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
const generateReport = document.querySelector("#generateReport");
const birthYear = document.querySelector("#birthYear");
const birthMonth = document.querySelector("#birthMonth");
const birthDay = document.querySelector("#birthDay");
const birthHour = document.querySelector("#birthHour");
const birthMinute = document.querySelector("#birthMinute");
const birthPlace = document.querySelector("#birthPlace");
const birthTimezone = document.querySelector("#birthTimezone");
const birthLongitude = document.querySelector("#birthLongitude");
const birthLatitude = document.querySelector("#birthLatitude");
const birthGender = document.querySelector("#birthGender");
const chartSourceTitle = document.querySelector("#chartSourceTitle");
const chartSourceMeta = document.querySelector("#chartSourceMeta");
const ziweiCore = document.querySelector("#ziweiCore");
const ziweiDetail = document.querySelector("#ziweiDetail");
const baziCore = document.querySelector("#baziCore");
const baziDetail = document.querySelector("#baziDetail");
const astroCore = document.querySelector("#astroCore");
const astroDetail = document.querySelector("#astroDetail");
const astroChartTitle = document.querySelector("#astroChartTitle");
const astroWheel = document.querySelector(".astro-wheel");
const astroSvgMount = document.querySelector("#astroSvgMount");
const sunSign = document.querySelector("#sunSign");
const moonSign = document.querySelector("#moonSign");
const ascSign = document.querySelector("#ascSign");
const astroRawState = document.querySelector("#astroRawState");
const synthesisTitle = document.querySelector("#synthesisTitle");
const synthesisText = document.querySelector("#synthesisText");

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
  }, 780);
}

function activateTab(tabName) {
  tabs.forEach((item) => item.classList.toggle("active", item.dataset.tab === tabName));
  views.forEach((view) => view.classList.toggle("active", view.id === tabName));
}

function buildMockChart(profile) {
  return {
    provider: "browser-mock",
    source: "AI 原型排盘",
    meta: `${profile.birthDate} ${profile.birthTime} · ${profile.birthPlace} · ${profile.gender}`,
    ziwei: {
      core: "命宫：天机坐守 · 身宫在迁移",
      detail: "紫微原型显示你更像观察型谋局者，适合先理解局势、再选择发力点。后续接入真实紫微盘后，这里会展示命宫、身宫、夫妻宫、事业宫与四化信息。"
    },
    bazi: {
      core: "日主：木气偏显 · 火土为用",
      detail: "八字原型倾向于先建立节律，再释放创造力。当前版本为模拟数据，正式接入后会替换为四柱、藏干、十神、五行强弱和大运流年。"
    },
    astro: {
      core: "月亮需求：稳定回应 · 金星偏慢热",
      detail: "星盘先作为辅助心理层，重点服务关系模式与合盘。后续会加入太阳、月亮、上升、金星、火星、七宫与相位。",
      sun: "狮子座",
      moon: "金牛座",
      ascendant: "天秤座",
      rawState: "mock"
    },
    synthesis: {
      title: "三盘共同主题：先安内在，再向外推进",
      text: "你的命盘原型不适合被外界节奏推着走。今日最重要的不是多做，而是把目标、边界和情绪顺序排清楚。先完成一个能落地的小行动，再做更大的判断。"
    }
  };
}

function getBirthProfile() {
  const month = String(birthMonth.value).padStart(2, "0");
  const day = String(birthDay.value).padStart(2, "0");
  const hour = String(birthHour.value).padStart(2, "0");
  const minute = String(birthMinute.value).padStart(2, "0");

  return {
    birthDate: `${birthYear.value}-${month}-${day}`,
    birthTime: `${hour}:${minute}`,
    birthPlace: birthPlace.value || "未填写地点",
    timezone: Number(birthTimezone.value || 8),
    longitude: Number(birthLongitude.value || 121.4737),
    latitude: Number(birthLatitude.value || 31.2304),
    gender: birthGender.value
  };
}

function renderChart(chart) {
  chartSourceTitle.textContent = chart.source;
  chartSourceMeta.textContent = chart.meta;
  ziweiCore.textContent = chart.ziwei.core;
  ziweiDetail.textContent = chart.ziwei.detail;
  baziCore.textContent = chart.bazi.core;
  baziDetail.textContent = chart.bazi.detail;
  astroCore.textContent = chart.astro.core;
  astroDetail.textContent = chart.astro.detail;
  astroChartTitle.textContent = chart.provider === "apiworks" ? "星盘 API 已返回" : "星盘原型盘面";
  renderAstroSvg(chart.astro.svg);
  sunSign.textContent = chart.astro.sun || "待映射";
  moonSign.textContent = chart.astro.moon || "待映射";
  ascSign.textContent = chart.astro.ascendant || "待映射";
  astroRawState.textContent = chart.astro.rawState || (chart.raw?.astro ? "已返回" : "未返回");
  synthesisTitle.textContent = chart.synthesis.title;
  synthesisText.textContent = chart.synthesis.text;
  activateTab("charts");
}

function renderAstroSvg(svg) {
  const hasSafeSvg = typeof svg === "string" && svg.trim().startsWith("<svg") && !/<script/i.test(svg);

  astroSvgMount.classList.toggle("hidden", !hasSafeSvg);
  astroWheel.classList.toggle("hidden", hasSafeSvg);
  astroSvgMount.innerHTML = hasSafeSvg ? svg : "";
}

function fillSelect(select, values, selectedValue) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    if (String(value) === String(selectedValue)) option.selected = true;
    select.appendChild(option);
  });
}

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}

function populateBirthDateSelects() {
  const currentYear = new Date().getFullYear();
  fillSelect(
    birthYear,
    Array.from({ length: 101 }, (_, index) => currentYear - index),
    1996
  );
  fillSelect(
    birthMonth,
    Array.from({ length: 12 }, (_, index) => index + 1),
    6
  );
  updateBirthDays(1);
}

function populateBirthTimeSelects() {
  fillSelect(
    birthHour,
    Array.from({ length: 24 }, (_, index) => index),
    8
  );
  fillSelect(
    birthMinute,
    Array.from({ length: 60 }, (_, index) => index),
    36
  );
}

function updateBirthDays(selectedDay = birthDay.value || 1) {
  const dayCount = daysInMonth(birthYear.value, birthMonth.value);
  const safeDay = Math.min(Number(selectedDay), dayCount);
  fillSelect(
    birthDay,
    Array.from({ length: dayCount }, (_, index) => index + 1),
    safeDay
  );
}

function syncPlaceMeta() {
  const selected = birthPlace.selectedOptions[0];
  if (!selected) return;

  birthTimezone.value = selected.dataset.timezone || 8;
  birthLongitude.value = selected.dataset.longitude || 121.4737;
  birthLatitude.value = selected.dataset.latitude || 31.2304;
}

async function generatePrototypeReport() {
  const profile = getBirthProfile();
  generateReport.textContent = "生成中...";
  generateReport.disabled = true;

  try {
    if (window.location.protocol === "file:") {
      renderChart(buildMockChart(profile));
      return;
    }

    const response = await fetch("/api/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    const chart = await response.json();

    if (!response.ok) {
      renderChart(chart.fallback || buildMockChart(profile));
      chartSourceMeta.textContent += `。接口暂未成功：${chart.error || "未知错误"}`;
      return;
    }

    renderChart(chart);
  } catch (error) {
    const fallback = buildMockChart(profile);
    renderChart(fallback);
    chartSourceMeta.textContent += `。本地服务暂不可用：${error.message}`;
  } finally {
    generateReport.textContent = "生成 AI 报告原型";
    generateReport.disabled = false;
  }
}

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

openBook.addEventListener("click", enterApp);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

document.querySelectorAll("[data-tab-jump]").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tabJump));
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

coachSend.addEventListener("click", answerQuestion);
coachInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") answerQuestion();
});
generateReport.addEventListener("click", generatePrototypeReport);
birthYear.addEventListener("change", () => updateBirthDays());
birthMonth.addEventListener("change", () => updateBirthDays());
birthPlace.addEventListener("change", syncPlaceMeta);
populateBirthDateSelects();
populateBirthTimeSelects();
syncPlaceMeta();

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
  stars = Array.from({ length: Math.min(140, Math.floor(window.innerWidth / 7)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.35 + 0.25,
    a: Math.random() * 0.55 + 0.1,
    v: Math.random() * 0.18 + 0.03
  }));
}

function drawSky() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.strokeStyle = "rgba(215, 181, 109, 0.045)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(window.innerWidth * 0.5, window.innerHeight * 0.46, 120 + i * 54, 0, Math.PI * 2);
    ctx.stroke();
  }

  stars.forEach((star) => {
    star.a += star.v * 0.01;
    const alpha = 0.16 + Math.abs(Math.sin(star.a)) * 0.58;
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
