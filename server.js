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
      detail: "星盘先作为辅助心理层，重点服务关系模式与合盘。后续会加入太阳、月亮、上升、金星、火星、七宫与相位。"
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

  return {
    provider: "apiworks",
    source: "ApiWorks 星图",
    meta: `${mock.meta} · 已通过服务端代理调用`,
    ziwei: {
      core: raw.ziwei ? "紫微盘：已生成" : mock.ziwei.core,
      detail: raw.ziwei ? "紫微斗数原始结构已返回，下一步会把宫位、主星、四化映射到可读 UI。" : mock.ziwei.detail
    },
    bazi: {
      core: raw.bazi ? "八字盘：已生成" : mock.bazi.core,
      detail: raw.bazi ? "八字原始结构已返回，下一步会把四柱、日主、十神、五行强弱映射到可读 UI。" : mock.bazi.detail
    },
    astro: {
      core: raw.astro ? "星盘：已生成" : mock.astro.core,
      detail: raw.astro ? "星盘原始结构已返回，下一步会把行星、宫位、相位映射到可读 UI。" : mock.astro.detail
    },
    synthesis: {
      title: "真实排盘已接入，等待解释层映射",
      text: "服务端已经拿到第三方排盘返回。下一步重点不是继续堆接口，而是把 raw 数据整理成观命自己的 ChartBundle，并接入 AI 本命分析和每日洞察。"
    },
    raw
  };
}

async function generateChartBundle(profile) {
  if ((process.env.CHART_PROVIDER || "mock").toLowerCase() !== "apiworks") {
    return buildMockChart(profile);
  }

  const payload = toApiWorksPayload(profile);
  const [astro, bazi, ziwei] = await Promise.all([
    postApiWorks(process.env.APIWORKS_CHART_NATAL_PATH || "/chart/natal", payload),
    postApiWorks(process.env.APIWORKS_BAZI_NATAL_PATH || "/bazi/natal", payload),
    postApiWorks(process.env.APIWORKS_ZIWEI_NATAL_PATH || "/ziwei/natal", payload)
  ]);

  return summarizeApiWorks(profile, { astro, bazi, ziwei });
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
