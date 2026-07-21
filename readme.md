# TravelShots - 旅行出片指南平台

面向爱拍照的旅行者，提供城市/景点/机位浏览、拍摄技巧、穿搭建议、构图指南，以及 AI 攻略生成。

线上地址: https://zilky7777.cn

## 功能概览

### 前台页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 中国地图交互 + 城市卡片列表，点击城市进入详情 |
| 城市详情 | `/city/:id` | 城市介绍 + 下属景点列表 |
| 景点详情 | `/city/:cityId/attraction/:id` | 景点信息 + 百度地图 + 下属拍照点位 |
| 点位详情 | `/spot/:id` | 拍摄时间、光线方向、构图建议、穿搭建议、摄影技巧 |
| AI 攻略 | `/guide` | 输入目的地，AI (DeepSeek) 实时流式生成旅行/摄影攻略 |
| 导入 | `/import` | 粘贴社交媒体链接或文本，AI 解析后创建点位 |
| 登录 | `/login` | 邮箱密码登录 |
| 注册 | `/register` | 邮箱密码注册 |

### 管理后台

管理后台地址: https://zilky7777.cn/admin

需要管理员账号登录后才能访问。登录后在导航栏会出现"管理后台"入口。

| 页面 | 路径 | 说明 |
|------|------|------|
| 仪表盘 | `/admin` | 城市/景点/点位/照片数量统计 |
| 城市管理 | `/admin/cities` | 新增/编辑/发布/排序城市 |
| 景点管理 | `/admin/attractions` | 新增/编辑景点，关联城市 |
| 点位管理 | `/admin/spots` | 新增/编辑拍照点位，关联景点 |
| 照片管理 | `/admin/photos` | 上传/删除照片，关联点位 |
| AI 攻略管理 | `/admin/guides` | 查看/删除已生成的攻略 |
| 导入管理 | `/admin/imports` | 查看/审核用户提交的导入内容 |

### 默认管理员账号

- 邮箱: `admin@zilky7777.cn`
- 密码: `admin123`

## 使用流程

### 普通用户

1. 打开首页，通过地图或城市卡片选择目的地
2. 进入城市页面，浏览该城市的景点列表
3. 进入景点页面，查看地图位置和拍照点位
4. 进入点位详情，获取最佳拍摄时间、光线方向、构图技巧、穿搭建议
5. 使用 AI 攻略功能，输入目的地自动生成旅行/摄影攻略
6. 使用导入功能，粘贴小红书等平台内容，AI 自动解析生成点位

### 管理员

1. 使用管理员账号登录
2. 通过后台管理城市、景点、点位数据 (增删改查)
3. 上传照片关联到具体点位
4. 审核用户导入的内容

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: PostgreSQL 16 + Drizzle ORM
- **认证**: Auth.js v5 (邮箱密码)
- **地图**: 百度地图 GL JS API
- **AI**: DeepSeek API (流式生成)
- **部署**: Docker Compose (Next.js standalone + PostgreSQL)

## 本地开发

```bash
# 启动数据库
docker compose up postgres -d

# 安装依赖
npm install

# 数据库迁移
npx drizzle-kit push

# 填充种子数据
npx tsx scripts/seed.ts

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 http://localhost:3000

## 生产部署

```bash
# 构建 Docker 镜像
docker build -t travel:latest .

# 导出镜像
docker save travel:latest | gzip > travel.tar.gz

# 上传到服务器
scp travel.tar.gz ubuntu@124.222.88.69:/tmp/

# 在服务器上加载并启动
ssh ubuntu@124.222.88.69
cd ~/travel
sudo docker load < /tmp/travel.tar.gz
sudo docker compose up -d --force-recreate app
```

生产环境运行在端口 3002，通过 Nginx 反向代理到 https://zilky7777.cn

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `AUTH_URL` | 站点 URL (生产环境必填) |
| `AUTH_SECRET` | Auth.js 签名密钥 |
| `AUTH_TRUST_HOST` | 设为 `true` (Docker 部署必填) |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 |
| `NEXT_PUBLIC_BAIDU_MAP_AK` | 百度地图 API Key |

## 目录结构

```
src/
  app/                  # Next.js App Router 页面
    admin/              # 管理后台
    api/                # API 路由
    city/               # 城市详情页
    guide/              # AI 攻略页
    import/             # 社交媒体导入页
    login/              # 登录页
    register/           # 注册页
    spot/               # 点位详情页
  components/           # 通用组件
    layout/             # 页头/页脚
    map/                # 百度地图/中国地图
    ui/                 # 基础 UI 组件
  db/                   # 数据库 schema 和连接
scripts/
  seed.ts               # 种子数据脚本
```
