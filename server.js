const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;

function loadLocalEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").trim();
    }
  });
}

loadLocalEnv();

const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function buildMockChart(profile) {
  const meta = `${profile.birthDate} ${profile.birthTime} · ${profile.birthPlace} · ${profile.gender}`;

  return {
    provider: "mock",
    source: "AI 原型排盘",
    meta,
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
    },
    raw: null
  };
}

function toApiWorksPayload(profile) {
  const birthDt = `${profile.birthDate} ${profile.birthTime || "00:00"}:00`;
  const genderMap = { 男: "male", 女: "female" };

  return {
    birth_dt: birthDt,
    tz: Number(profile.timezone || 8),
    longitude: Number(profile.longitude || 121.4737),
    latitude: Number(profile.latitude || 31.2304),
    gender: genderMap[profile.gender] || "unknown"
  };
}

function apiWorksUrl(endpointPath) {
  const baseUrl = process.env.APIWORKS_BASE_URL || "https://cloud.apiworks.com/open/astro";
  return `${baseUrl.replace(/\/$/, "")}${endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`}`;
}

async function postApiWorks(endpointPath, payload) {
  const appId = process.env.APIWORKS_APP_ID;
  const appKey = process.env.APIWORKS_APP_KEY;

  if (!appId || !appKey || appId === "your_app_id" || appKey === "your_app_key") {
    throw new Error("Missing ApiWorks credentials");
  }

  const response = await fetch(apiWorksUrl(endpointPath), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Id": appId,
      "X-App-Key": appKey
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.code !== 0) {
    const message = data?.msg || `ApiWorks request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return data.data;
}

function summarizeApiWorks(profile, raw) {
  const mock = buildMockChart(profile);
  const astroRaw = raw.astro?.data || raw.astro;
  const baziRaw = raw.bazi?.data || raw.bazi;
  const ziweiRaw = raw.ziwei?.data || raw.ziwei;
  const errors = Object.entries(raw.errors || {})
    .map(([name, message]) => `${name}: ${message}`)
    .join("；");

  return {
    provider: "apiworks",
    source: "ApiWorks 星图",
    meta: errors ? `${mock.meta} · 部分接口已返回，失败项：${errors}` : `${mock.meta} · 已通过服务端代理调用`,
    ziwei: {
      core: ziweiRaw ? "紫微盘：已生成" : mock.ziwei.core,
      detail: ziweiRaw ? "紫微斗数原始结构已返回，下一步会把宫位、主星、四化映射到可读 UI。" : mock.ziwei.detail
    },
    bazi: {
      core: baziRaw ? "八字盘：已生成" : mock.bazi.core,
      detail: baziRaw ? "八字原始结构已返回，下一步会把四柱、日主、十神、五行强弱映射到可读 UI。" : mock.bazi.detail
    },
    astro: {
      core: astroRaw ? buildAstroCore(astroRaw) : mock.astro.core,
      detail: astroRaw ? "星盘原始结构已返回，下一步会把行星、宫位、相位映射到可读 UI。" : mock.astro.detail,
      sun: findPlanetSign(astroRaw, ["Sun", "太阳", "0"]),
      moon: findPlanetSign(astroRaw, ["Moon", "月亮", "1"]),
      ascendant: findPlanetSign(astroRaw, ["ASC", "Asc", "上升", "10"]) || findAscendantFromHouse(astroRaw),
      rawState: astroRaw ? "已返回" : "未返回"
    },
    synthesis: {
      title: astroRaw || baziRaw || ziweiRaw ? "真实排盘已接入，等待解释层映射" : mock.synthesis.title,
      text: astroRaw || baziRaw || ziweiRaw
        ? "服务端已经拿到第三方排盘返回。下一步重点不是继续堆接口，而是把 raw 数据整理成观命自己的 ChartBundle，并接入 AI 本命分析和每日洞察。"
        : mock.synthesis.text
    },
    raw: {
      astro: astroRaw,
      bazi: baziRaw,
      ziwei: ziweiRaw,
      errors: raw.errors || {}
    }
  };
}

function buildAstroCore(raw) {
  const sun = findPlanetSign(raw, ["Sun", "太阳", "0"]);
  const moon = findPlanetSign(raw, ["Moon", "月亮", "1"]);
  const ascendant = findPlanetSign(raw, ["ASC", "Asc", "上升", "10"]) || findAscendantFromHouse(raw);

  return `星盘：太阳${sun || "待映射"} · 月亮${moon || "待映射"} · 上升${ascendant || "待映射"}`;
}

function formatPlanetSign(planet) {
  const sign = planet.sign?.sign_cn || planet.sign_cn || planet.sign_name;
  if (!sign) return null;
  const degree = Number.isFinite(planet.sign?.deg) ? `${planet.sign.deg}°` : "";
  return `${sign}${degree}`;
}

function findPlanetSign(raw, aliases) {
  if (!raw) return null;
  const planets = Array.isArray(raw.planet) ? raw.planet : [];
  const matchedPlanet = planets.find((planet) => {
    const values = [planet.planet_en, planet.planet_cn, planet.planet_name, planet.planet_code].map(String);
    return aliases.some((alias) => values.includes(alias));
  });

  if (matchedPlanet) return formatPlanetSign(matchedPlanet);

  const signs = Array.isArray(raw.sign) ? raw.sign : [];
  for (const sign of signs) {
    const planetArray = Array.isArray(sign.planet_array) ? sign.planet_array : [];
    const planet = planetArray.find((item) => {
      const values = [item.planet_en, item.planet_cn, item.planet_name, item.planet_code].map(String);
      return aliases.some((alias) => values.includes(alias));
    });
    if (planet) return `${sign.sign_cn || sign.sign_name}${Number.isFinite(planet.deg) ? `${planet.deg}°` : ""}`;
  }

  return null;
}

function findAscendantFromHouse(raw) {
  if (!raw) return null;
  const houses = Array.isArray(raw.house) ? raw.house : [];
  const firstHouse = houses.find((house) => Number(house.house_id || house.id) === 1) || houses[0];
  if (!firstHouse) return null;
  return firstHouse.sign?.sign_cn || firstHouse.sign_cn || firstHouse.sign_name || null;
}

function findAstroValue(raw, keys) {
  if (!raw) return "待映射";
  const text = JSON.stringify(raw);

  for (const key of keys) {
    const direct = raw[key];
    if (typeof direct === "string") return direct;
    if (direct && typeof direct === "object") {
      return direct.sign || direct.zodiac || direct.name || JSON.stringify(direct).slice(0, 24);
    }

    const pattern = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i");
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return "待映射";
}

async function safePostApiWorks(name, endpointPath, payload) {
  try {
    return { name, data: await postApiWorks(endpointPath, payload) };
  } catch (error) {
    return { name, error: error.message };
  }
}

async function generateChartBundle(profile) {
  if ((process.env.CHART_PROVIDER || "mock").toLowerCase() !== "apiworks") {
    return buildMockChart(profile);
  }

  const payload = toApiWorksPayload(profile);
  const results = await Promise.all([
    safePostApiWorks("astro", process.env.APIWORKS_CHART_NATAL_PATH || "/chart/natal", payload),
    safePostApiWorks("bazi", process.env.APIWORKS_BAZI_NATAL_PATH || "/bazi/natal", payload),
    safePostApiWorks("ziwei", process.env.APIWORKS_ZIWEI_NATAL_PATH || "/ziwei/natal", payload)
  ]);
  const raw = { errors: {} };

  results.forEach((result) => {
    if (result.error) {
      raw.errors[result.name] = result.error;
      return;
    }
    raw[result.name] = result.data;
  });

  if (!raw.astro && !raw.bazi && !raw.ziwei) {
    throw new Error(Object.values(raw.errors).join("；") || "All ApiWorks requests failed");
  }

  return summarizeApiWorks(profile, raw);
}

async function handleApi(req, res) {
  if (req.method !== "POST" || req.url !== "/api/charts") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  let profile = null;

  try {
    profile = await readJsonBody(req);
    const chartBundle = await generateChartBundle(profile);
    sendJson(res, 200, chartBundle);
  } catch (error) {
    sendJson(res, 500, {
      error: error.message,
      fallback: buildMockChart(profile || {
        birthDate: "未填写日期",
        birthTime: "未填写时间",
        birthPlace: "未知地点",
        gender: "未知"
      })
    });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(rootDir, requestedPath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Guanming dev server running at http://localhost:${port}`);
});
