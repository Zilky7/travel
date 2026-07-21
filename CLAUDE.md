每个 Plan 至少提出 6 个问题，覆盖以下维度：
1. 需求意图确认（你理解的目标是什么，和我核对）
2. 边界条件（哪些情况不处理、哪些是硬约束）
3. 对现有模块的影响（改动会波及哪些文件/接口）
4. 可选方案取舍（至少给两个方案并说明推荐理由）
5. 验收标准（怎样算做完了）
6. 潜在风险（可能翻车的点）
代码中不要有emoji表情
有不明白的就问！！！
尽量分次写入，每次更新最高不超过150行
目前代码开发是在我本地的wsl上，修改完需要推到腾讯云服务器上，最好是以docker的形式
这个项目的本地开发目录是/home/zilky7/zhengyu/zilky7/apps/travel
你每次修复代码完成之后，记得部署到腾讯云服务器啊
每次较大的任务需求你就使用/home/zilky7/zhengyu/zilky7/apps/travel/.claude/skills/vibe-builder
爬取小红书图文数据的工具在本地wsl这个目录/home/zilky7/zhengyu/zilky7/tools/spider-xhs
每次代码改动完成后，必须将改动内容写入 CHANGELOG.md 文件（包含日期、阶段、具体改动项）

我的服务器上https://zilky7777.cn 这个是导航页，上面有两个服务，一个是foodmap，地址是https://yummy.zilky7777.cn/    一个是travel 地址是https://travel.zilky7777.cn/ 

## CHANGELOG 格式规范
- 每个工作会话用 `### Session: 日期 时间段` 标记
- 每条变更用 `[x]` 表示已完成，`[ ]` 表示进行中或待办
- 进行中的条目在括号内注明进度，如 `[ ] AI推荐功能（进行中，完成70%）`
- CHANGELOG 只记录变更条目，交接信息统一放 handoff.md（见下）

## 文档职责划分

本项目文档分三类，职责分开，不互相混写：

| 文档 | 职责 | 更新方式 |
|---|---|---|
| CLAUDE.md | 项目背景、技术栈、架构、命令（长期稳定） | 按需改 |
| CHANGELOG.md | 变更流水（已完成/进行中条目，按时间累积） | 每次变更追加 |
| handoff.md | 当下接手状态（环境/卡点/下一步） | 每次收工覆盖 |

- 项目背景只写 CLAUDE.md，不写进 CHANGELOG 或 handoff
- 变更明细只写 CHANGELOG，不写进 CLAUDE.md 或 handoff
- 接手状态只写 handoff.md，不写进 CLAUDE.md 或 CHANGELOG
- 新会话启动顺序：先读 handoff.md → 再读 CHANGELOG.md 最近 Session → CLAUDE.md 顶部

## 会话交接（handoff.md）

用户说"收工"/"结束"/"交接"时，在项目根目录生成/覆盖 handoff.md 交接给下个会话（模板和完整规则见全局 CLAUDE.md "会话交接（handoff.md）"章节）。内容比 CHANGELOG 更全：会话信息/进度/未决问题/环境状态/重要文件指引/卡点/下一步。新会话启动优先读 handoff.md。handoff.md 加入 .gitignore 不提交。

代码中不要有emoji表情
有不明白的就问！！！
尽量分次写入，每次更新最高不超过150行
目前代码开发是在我本地的wsl上，修改完需要推到腾讯云服务器上，最好是以docker的形式
这个项目的本地开发目录是/home/zilky7/zhengyu/zilky7/apps/travel


和我交流说中文

不同Phase之间，如果没有依赖关系，可以使用subagents来并行提高效率

我目前可以提供的资源：
1，腾讯云4c4g的服务器，已经买了一年，预装了ubuntu和docker ubuntu@124.222.88.69  
2，域名也买了一年  zilky7777.cn   ssl证书也配置了免费的，有效期三个月
3，DeepSeek API
4，百度地图apikey wmLUPRgtlIWlpCBSfdL9yM7rq0brHmwR


# DeepSeek API
DEEPSEEK_API_KEY=sk-074e742a1e004208aa55673316c0b0e5
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 小米API (优先使用，OpenAI兼容协议)
XIAOMI_API_KEY=tp-c4zqvc6qjyyrghtn4ng95yq9dxa4osbngioxpzcrw0daqafm
XIAOMI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
XIAOMI_MODEL=mimo-v2.5-pro

兼容 OpenAI 接口协议：
https://token-plan-cn.xiaomimimo.com/v1
兼容 Anthropic 接口协议：
https://token-plan-cn.xiaomimimo.com/anthropic


# 腾讯云服务器
SERVER_HOST=124.222.88.69
SERVER_USER=ubuntu
SERVER_PASS=qwe!@#123



---

## Vibe Builder Project Reference

### CONTEXT OVERFLOW RECOVERY
**When context gets full or you feel lost in a long session:**
1. Re-read the vibe-builder skill: `.claude/skills/vibe-builder/SKILL.md`
2. Re-read `DEVELOPMENT_PLAN.md` to check current progress
3. Re-read `TEST_PLAN.md` (if exists) to check test status
4. Follow the workflow strictly - especially the checkpoints below!

### WORKFLOW CHECKPOINTS (MANDATORY - DO NOT SKIP!)
| After Phase | Action |
| --- | --- |
| Phase 3 (Coding) complete | -> Create TEST_PLAN.md -> STOP for Human review |
| Phase 4 (Test Plan) approved | -> Execute tests autonomously |
| Phase 5 (Testing) complete | -> Report results -> Enter Phase 6 loop |

**CRITICAL:** After finishing ALL coding tasks, you MUST:
1. Create TEST_PLAN.md
2. STOP and wait for Human approval
3. DO NOT run any tests until Human reviews TEST_PLAN.md!

### Project Summary
- **App Type**: Web App (旅行出片指南平台 v2, 参考可颂App)
- **Target Users**: 爱拍照出片的年轻女生, 旅行爱好者
- **Tech Stack**: Next.js 14 + TypeScript + PostgreSQL (Docker) + Drizzle ORM + Tailwind CSS 4
- **Core Features**: 景点瀑布流浏览, 景点详情(含多个拍照机位), 出片地图, AI攻略
- **Docker Services**: Next.js standalone + PostgreSQL 16, port 3002
- **Current Phase**: v2 重构 - 以景点为核心
- **核心变化**: 景点是主体，机位是子内容(vs v1的机位为主体)

### Primary Documentation
- `PRD.md` - v2产品需求文档(景点为核心)
- `IMPLEMENTATION_PLAN.md` - v2实施计划与进度
- `TEST_PLAN.md` - Test cases (created after coding complete)

### Coding Guidelines
- Follow `DEVELOPMENT_PLAN.md` for tasks
- Use TypeScript with strict mode
- Mark completed tasks with `[x]`
- Keep code minimal and focused

---

## 自动化执行约束（/loop 模式适用）

当处于自动循环执行模式时，必须遵守以下规则：

### 每轮必做
- 修改代码后必须运行相关测试/构建命令，确认无报错
- 每轮结束前用 git diff 检查改动范围，确保没有改到无关文件
- 如果连续 3 轮未取得进展（同一个错误反复出现），主动停下并报告问题

### 禁止事项
- 不得修改 CLAUDE.md、.env、docker-compose.yml 等配置文件（除非任务明确要求）
- 不得删除现有功能代码（除非任务明确要求重构）
- 不得安装未经确认的新依赖包
- 不得执行任何远程部署操作（push、ssh、docker push 等）

### 完成信号
- 所有验收标准满足后，输出一行：`[LOOP DONE] 任务完成，验收标准已全部满足`
- 如果遇到无法自行解决的阻塞，输出：`[LOOP BLOCKED] 原因：<具体描述>`