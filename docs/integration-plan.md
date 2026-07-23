# 排盘服务接入方案

## 目标

观命第一版不急着自研完整排盘算法，先把产品体验跑通：

1. 用户输入出生日期、出生时间、出生地点、性别。
2. 外部排盘服务生成紫微盘、八字盘、星盘。
3. 观命把排盘结果结构化。
4. AI 基于结构化命盘生成本人分析、每日洞察、命盘教练建议。

## 测测接入判断

测测类产品适合作为能力参考或合作对象，但不建议直接抓取 App 页面或截图作为长期方案。

原因：

- 稳定性差，页面或接口变化会导致功能失效。
- 可能涉及账号、验证码、风控和服务条款问题。
- 用户出生信息属于敏感个人资料，必须明确数据流向和授权。
- AI 解读需要结构化字段，截图或非结构化文本会降低准确度。

## 推荐方案

### 方案 A：正式 API 或商务合作

最理想。

需要确认：

- 是否提供紫微、八字、星盘排盘 API。
- 是否允许商业产品调用。
- 返回字段是否足够结构化。
- 数据是否可以保存。
- 价格、调用频率、失败重试、隐私条款。

### 方案 B：使用第三方排盘 API

如果测测没有开放 API，可以选择专门的排盘 API 服务。

接口层保持统一：

```text
BirthProfile -> ChartProvider -> ChartBundle -> AI Report
```

### 方案 C：自研核心排盘

长期最稳。

优先级：

1. 八字排盘
2. 紫微斗数排盘
3. 星盘/合盘

## 前端当前状态

当前前端已经加入 `盘象` 模块：

- 紫微斗数结果卡
- 八字命盘结果卡
- 西洋星盘结果卡
- AI 综合解读

现在使用 mock 数据模拟外部排盘服务返回。后续只需要替换 `buildMockChart` 逻辑为真实接口调用。

## 当前工程接入状态

项目已经加入服务端代理：

```text
server.js
```

前端通过：

```text
POST /api/charts
```

请求排盘。服务端根据 `CHART_PROVIDER` 决定使用 mock 还是 ApiWorks。

这样做的原因：

- API 密钥不会暴露在浏览器代码里。
- 前端只依赖统一的 `ChartBundle`。
- 后续从 ApiWorks 切到自研排盘，不需要重写 UI。

本地密钥配置参考：

```text
.env.example
```

## 数据结构草案

```json
{
  "profile": {
    "birthDate": "1996-08-18",
    "birthTime": "08:36",
    "birthPlace": "上海，中国",
    "gender": "女"
  },
  "ziwei": {
    "mingGong": "",
    "shenGong": "",
    "palaces": [],
    "majorStars": [],
    "transformations": []
  },
  "bazi": {
    "pillars": [],
    "dayMaster": "",
    "tenGods": [],
    "fiveElements": {},
    "luckCycles": []
  },
  "astro": {
    "sun": "",
    "moon": "",
    "ascendant": "",
    "venus": "",
    "mars": "",
    "houses": [],
    "aspects": []
  }
}
```
