# Development Plan - Travel Photo Guide Platform

> 旅行出片指南 | zilky7777.cn

## 1. 项目概述

### 1.1 产品定位

主打**出片机位分享**的旅行平台, 帮助用户快速找到好看、容易出片的拍照点位。

### 1.2 目标用户

| 优先级 | 用户画像 | 核心需求 |
|--------|---------|---------|
| 主要 | 爱拍照出片的女生 | 找到出片机位, 知道怎么拍好看, 穿搭/姿势/滤镜参考 |
| 次要 | 旅行爱好者 | 获取旅行攻略、景点信息、行程规划 |

### 1.3 核心差异化

- 以**拍摄机位**(Spot)为最小粒度, 不止告诉你去哪, 还告诉你**站哪拍、什么时间拍、怎么拍好看**
- 每个机位包含: 最佳拍摄时间、光线方向、推荐构图、穿搭配色建议、出片样张
- 内容调性偏向小红书风格: 实用、好看、易模仿

---

## 2. 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 14 (App Router) | SSR + 静态生成, TypeScript |
| 数据库 | PostgreSQL 16 (Docker) | 支持并发写入, JSONB, 生产级 |
| ORM | Drizzle ORM | 类型安全, 轻量, 迁移工具完善 |
| 样式 | Tailwind CSS 4 | 原子化CSS, 响应式设计 |
| 认证 | Auth.js v5 (Credentials) | MVP邮箱密码, 未来扩展微信/手机号 |
| 地图 | 百度地图 JS API v3 | 客户端动态加载, 避免SSR问题 |
| AI | DeepSeek API (deepseek-chat) | 攻略生成 + 社媒内容解析 |
| 部署 | Docker Compose | 单容器App + PostgreSQL, 端口3002 |
| 服务器 | 腾讯云 4c4g Ubuntu | 124.222.88.69 |
| 域名 | zilky7777.cn | SSL已配置 |

---

## 3. 数据模型

### 3.1 users (用户)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK, auto | 主键 |
| email | varchar(255) | UNIQUE, NOT NULL | 登录邮箱 |
| password_hash | varchar(255) | NOT NULL | bcrypt哈希密码 |
| name | varchar(100) | | 昵称 |
| avatar_url | text | | 头像URL |
| role | varchar(20) | DEFAULT 'user' | user / admin |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

### 3.2 cities (城市)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| name | varchar(100) | NOT NULL | 城市名称 |
| name_en | varchar(100) | | 英文名 |
| description | text | | 城市简介 |
| cover_image | text | | 封面图URL |
| province | varchar(50) | | 省份 |
| latitude | decimal(10,7) | | 纬度 |
| longitude | decimal(10,7) | | 经度 |
| sort_order | integer | DEFAULT 0 | 排序权重 |
| is_published | boolean | DEFAULT true | 是否发布 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

### 3.3 attractions (景点)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| city_id | integer | FK -> cities.id, NOT NULL | 所属城市 |
| name | varchar(200) | NOT NULL | 景点名称 |
| description | text | | 景点描述 |
| cover_image | text | | 封面图URL |
| address | varchar(500) | | 详细地址 |
| latitude | decimal(10,7) | | 纬度 |
| longitude | decimal(10,7) | | 经度 |
| open_hours | varchar(200) | | 开放时间 |
| ticket_info | varchar(200) | | 门票信息 |
| tips | text | | 游玩贴士 |
| sort_order | integer | DEFAULT 0 | 排序权重 |
| is_published | boolean | DEFAULT true | 是否发布 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

### 3.4 spots (出片机位)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| attraction_id | integer | FK -> attractions.id, NOT NULL | 所属景点 |
| name | varchar(200) | NOT NULL | 机位名称 |
| description | text | | 机位描述 |
| cover_image | text | | 封面图URL(出片样张) |
| latitude | decimal(10,7) | | 纬度 |
| longitude | decimal(10,7) | | 经度 |
| best_time | varchar(100) | | 最佳拍摄时间段(如"日落前1h 17:00-18:30") |
| best_season | varchar(100) | | 最佳拍摄季节 |
| light_direction | varchar(100) | | 光线方向(如"下午逆光, 适合剪影") |
| composition_tips | text | | 构图建议(如"低角度仰拍, 人物居中") |
| outfit_tips | text | | 穿搭配色建议(如"白色长裙, 与蓝天形成对比") |
| photo_tips | text | | 拍摄技巧(手机/相机参数/角度) |
| difficulty | varchar(20) | DEFAULT 'easy' | easy/medium/hard |
| sort_order | integer | DEFAULT 0 | 排序权重 |
| is_published | boolean | DEFAULT true | 是否发布 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

### 3.5 photos (照片)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| spot_id | integer | FK -> spots.id, nullable | 所属机位 |
| attraction_id | integer | FK -> attractions.id, nullable | 所属景点 |
| city_id | integer | FK -> cities.id, nullable | 所属城市 |
| url | text | NOT NULL | 图片URL |
| thumbnail_url | text | | 缩略图URL |
| alt | varchar(300) | | 图片描述 |
| width | integer | | 宽度px |
| height | integer | | 高度px |
| sort_order | integer | DEFAULT 0 | 排序权重 |
| created_at | timestamp | DEFAULT now() | |

### 3.6 guides (AI生成攻略)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| user_id | uuid | FK -> users.id, nullable | 生成用户 |
| destination | varchar(200) | NOT NULL | 目的地 |
| guide_type | varchar(20) | DEFAULT 'both' | travel/photography/both |
| prompt | text | | 用户输入的原始提示 |
| content | text | NOT NULL | 生成的Markdown内容 |
| duration_days | integer | | 建议天数 |
| created_at | timestamp | DEFAULT now() | |

### 3.7 social_imports (社媒导入)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | serial | PK | 主键 |
| user_id | uuid | FK -> users.id, nullable | 导入用户 |
| platform | varchar(30) | NOT NULL | xiaohongshu/douyin/manual |
| source_url | text | | 来源链接(手动粘贴时为空) |
| raw_content | text | NOT NULL | 原始内容 |
| parsed_data | jsonb | | AI解析后的结构化数据 |
| status | varchar(20) | DEFAULT 'pending' | pending/parsed/approved/rejected |
| linked_spot_id | integer | FK -> spots.id, nullable | 关联的机位 |
| created_at | timestamp | DEFAULT now() | |

### 3.8 实体关系

```
cities 1---N attractions 1---N spots
  |                |              |
  |---N photos     |---N photos   |---N photos
                                  |
                        social_imports N---1 spots (optional)

users 1---N guides
users 1---N social_imports
```

---

## 4. 项目结构

```
travel/
  docker-compose.yml
  docker-compose.dev.yml
  Dockerfile
  .env.local                      # 本地开发环境变量(git-ignored)
  .env.production                 # 生产环境变量模板
  next.config.mjs
  tailwind.config.ts
  tsconfig.json
  drizzle.config.ts
  package.json
  public/
    images/                       # 静态占位图
    uploads/                      # 用户上传文件(Docker Volume)
  src/
    app/
      layout.tsx                  # 根布局(字体/全局Meta)
      page.tsx                    # 首页 - 城市列表
      globals.css                 # Tailwind入口 + 自定义样式
      city/
        [cityId]/
          page.tsx                # 城市详情 - 景点列表
          attraction/
            [attractionId]/
              page.tsx            # 景点详情 - 机位列表 + 地图
      spot/
        [spotId]/
          page.tsx                # 机位详情 - 照片/地图/拍摄建议
      guide/
        page.tsx                  # AI攻略生成页
      import/
        page.tsx                  # 社媒内容导入页
      auth/
        login/page.tsx            # 登录
        register/page.tsx         # 注册
      admin/
        layout.tsx                # 管理后台布局(侧边栏)
        page.tsx                  # 管理仪表盘
        cities/
          page.tsx                # 城市列表(CRUD)
          new/page.tsx            # 新建城市
          [id]/edit/page.tsx      # 编辑城市
        attractions/
          page.tsx
          new/page.tsx
          [id]/edit/page.tsx
        spots/
          page.tsx
          new/page.tsx
          [id]/edit/page.tsx
        photos/page.tsx           # 照片管理(上传/分配)
        users/page.tsx            # 用户管理
        guides/page.tsx           # 查看AI攻略
        imports/page.tsx          # 审核社媒导入
      api/
        health/route.ts
        auth/[...nextauth]/route.ts
        cities/
          route.ts                # GET列表 / POST创建
          [id]/route.ts           # GET详情 / PUT更新 / DELETE删除
        attractions/
          route.ts
          [id]/route.ts
        spots/
          route.ts
          [id]/route.ts
        photos/
          route.ts
          [id]/route.ts
          upload/route.ts         # 文件上传
        guides/
          route.ts                # GET列表 / POST生成
          [id]/route.ts
        imports/
          route.ts                # GET列表 / POST创建
          [id]/route.ts
          parse/route.ts          # POST AI解析
        admin/
          stats/route.ts          # 仪表盘统计
    db/
      index.ts                    # Drizzle客户端实例
      schema.ts                   # 全部表Schema定义
      migrations/                 # Drizzle迁移文件
    lib/
      auth.ts                     # Auth.js配置
      deepseek.ts                 # DeepSeek API客户端
      social-parser.ts            # 社媒链接解析逻辑
      utils.ts                    # 通用工具函数
    components/
      ui/                         # 基础UI组件
        button.tsx
        input.tsx
        card.tsx
        modal.tsx
        loading.tsx
        toast.tsx
      layout/
        header.tsx
        footer.tsx
        admin-sidebar.tsx
      map/
        baidu-map.tsx             # 百度地图封装组件
      city-card.tsx
      attraction-card.tsx
      spot-card.tsx
      photo-gallery.tsx
      guide-form.tsx
      guide-result.tsx
      import-form.tsx
      admin/
        data-table.tsx            # 通用管理表格
        form-field.tsx
        image-upload.tsx
    types/
      index.ts                    # 共享TypeScript类型
  scripts/
    seed.ts                       # 数据库种子数据
    deploy.sh                     # 部署脚本
```

---

## 5. API 路由

### 5.1 公开 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/cities | 城市列表(已发布) |
| GET | /api/cities/[id] | 城市详情(含景点列表) |
| GET | /api/attractions/[id] | 景点详情(含机位列表) |
| GET | /api/spots/[id] | 机位详情(含照片) |
| POST | /api/guides | 生成AI攻略 |
| GET | /api/guides/[id] | 获取指定攻略 |
| POST | /api/imports | 提交社媒导入(链接或手动文本) |
| POST | /api/imports/parse | 触发AI解析导入内容 |

### 5.2 认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| * | /api/auth/[...nextauth] | Auth.js处理(登录/注册/会话) |

### 5.3 管理 API (需要admin角色)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/stats | 仪表盘统计数据 |
| POST | /api/cities | 创建城市 |
| PUT | /api/cities/[id] | 更新城市 |
| DELETE | /api/cities/[id] | 删除城市 |
| POST | /api/attractions | 创建景点 |
| PUT | /api/attractions/[id] | 更新景点 |
| DELETE | /api/attractions/[id] | 删除景点 |
| POST | /api/spots | 创建机位 |
| PUT | /api/spots/[id] | 更新机位 |
| DELETE | /api/spots/[id] | 删除机位 |
| POST | /api/photos/upload | 上传照片 |
| PUT | /api/photos/[id] | 更新照片信息 |
| DELETE | /api/photos/[id] | 删除照片 |
| GET | /api/imports | 导入列表(管理视图) |
| PUT | /api/imports/[id] | 更新导入状态(审核) |

---

## 6. 页面路由

### 6.1 公开页面

| 路径 | 说明 |
|------|------|
| / | 首页 - 城市卡片网格 + 搜索 |
| /city/[cityId] | 城市页 - 城市信息 + 景点列表 + 城市地图 |
| /city/[cityId]/attraction/[id] | 景点页 - 景点信息 + 机位列表 + 地图标注 |
| /spot/[spotId] | 机位页 - 照片画廊 + 地图 + 拍摄建议 |
| /guide | AI攻略生成页 |
| /import | 社媒内容导入页 |
| /auth/login | 登录页 |
| /auth/register | 注册页 |

### 6.2 管理页面

| 路径 | 说明 |
|------|------|
| /admin | 仪表盘(统计概览) |
| /admin/cities | 城市CRUD列表 |
| /admin/cities/new | 新建城市 |
| /admin/cities/[id]/edit | 编辑城市 |
| /admin/attractions | 景点CRUD列表 |
| /admin/attractions/new | 新建景点 |
| /admin/attractions/[id]/edit | 编辑景点 |
| /admin/spots | 机位CRUD列表 |
| /admin/spots/new | 新建机位 |
| /admin/spots/[id]/edit | 编辑机位 |
| /admin/photos | 照片管理 |
| /admin/users | 用户管理 |
| /admin/guides | AI攻略查看 |
| /admin/imports | 社媒导入审核 |

---

## 7. 实现阶段

### Phase 1: 项目初始化 + Docker + 数据库

- [x] 使用 `npx create-next-app@14` 初始化项目(TypeScript + App Router + Tailwind)
- [x] 配置 `next.config.mjs`: 启用 `output: 'standalone'`
- [x] 安装核心依赖: `drizzle-orm`, `postgres`, `drizzle-kit`
- [x] 创建 `docker-compose.dev.yml`: 本地PostgreSQL 16容器
- [x] 启动本地PostgreSQL, 验证连接
- [x] 编写 `src/db/schema.ts`: 定义全部7张表Schema
- [x] 配置 `drizzle.config.ts`, 执行初始迁移
- [x] 创建 `src/db/index.ts`: Drizzle客户端单例
- [x] 创建 `/api/health` 健康检查端点
- [x] 编写 `scripts/seed.ts`: 种子数据(2个城市, 3个景点, 5个机位)
- [x] 执行种子脚本, 验证数据库数据

### Phase 2: 管理后台

- [x] 创建基础UI组件: button, input, card, modal, toast, loading
- [x] 创建管理后台布局 `admin/layout.tsx`: 侧边栏导航
- [x] 构建仪表盘页面: 展示城市/景点/机位/用户数量统计
- [ ] 构建通用管理表格组件 `data-table.tsx`: 支持分页、排序
- [ ] 构建通用表单字段组件 `form-field.tsx`: 支持验证
- [ ] 构建图片上传组件 `image-upload.tsx`: 预览+上传
- [x] 实现城市CRUD: API路由(GET/POST/PUT/DELETE) + 管理页面(列表/新建/编辑)
- [x] 实现景点CRUD: API路由 + 管理页面(含城市选择器)
- [x] 实现机位CRUD: API路由 + 管理页面(含景点选择器、摄影信息字段)
- [x] 实现照片管理: 上传API + 管理页面(上传/分配到城市/景点/机位)
- [ ] 实现用户管理页面: 用户列表, 角色切换

### Phase 3: 公开页面 + 百度地图

- [x] 创建公共布局: Header导航栏 + Footer
- [x] 构建首页: 响应式城市卡片网格 + 搜索/筛选
- [x] 构建城市详情页: 城市信息 + 景点卡片列表
- [x] 构建景点详情页: 景点信息 + 机位列表 + 百度地图定位
- [x] 构建机位详情页: 照片画廊 + 拍摄建议 + 百度地图精确标注
- [x] 封装百度地图组件 `baidu-map.tsx`: 动态加载(ssr:false), 支持标记点
- [x] 实现景点页地图: 展示该景点下所有机位的标记点
- [x] 构建照片画廊组件: 支持灯箱放大查看
- [x] 实现响应式设计: 375px / 768px / 1440px 三档适配
- [ ] 添加页面骨架屏加载状态
- [x] 构建城市/景点/机位卡片组件: 封面图 + hover效果

### Phase 4: AI攻略生成

- [x] 创建DeepSeek API客户端 `src/lib/deepseek.ts`: 支持流式响应
- [x] 设计攻略生成Prompt模板: 旅行+摄影专家角色设定
- [x] 实现 `/api/guides` POST端点: 接收目的地+类型, 调用DeepSeek, 存储结果
- [x] 构建攻略生成页UI: 目的地输入 + 攻略类型选择(旅行/摄影/综合)
- [x] 实现流式响应展示: 逐字输出效果(typewriter)
- [x] 存储已生成攻略到数据库
- [ ] 添加攻略历史列表(登录用户可查看自己的历史)
- [x] 管理后台攻略查看页面
- [x] 错误处理: 超时/限流/网络异常的友好提示

### Phase 5: 社交媒体导入

- [x] 创建社媒解析库 `src/lib/social-parser.ts`
- [x] 实现小红书URL识别和基础元数据提取
- [x] 实现抖音URL识别和基础元数据提取
- [x] 实现AI内容解析: 发送原始内容给DeepSeek, 提取结构化机位信息
- [x] 创建 `/api/imports` POST端点: 接受URL或手动文本
- [x] 创建 `/api/imports/parse` POST端点: 触发AI解析
- [x] 构建导入页UI: URL输入框 + 手动文本粘贴区 + 解析预览
- [x] 构建管理后台导入审核页: 列表展示, 审核/驳回, 关联机位
- [x] 支持从审核通过的导入直接创建新机位

### Phase 6: 认证 + 用户功能

- [x] 安装配置 Auth.js v5 (Credentials Provider)
- [x] 创建认证配置 `src/lib/auth.ts`: JWT策略
- [x] 实现密码哈希(bcrypt)
- [x] 构建登录页: 表单验证 + 错误提示
- [x] 构建注册页: 邮箱+密码+昵称
- [x] 根布局添加SessionProvider
- [x] 中间件保护管理路由: 检查role === 'admin'
- [x] 保护攻略生成和导入端点: 要求登录
- [x] Header添加用户菜单: 登录状态显示昵称+退出按钮
- [x] 种子脚本中创建初始管理员账号

### Phase 7: 优化 + 部署

- [x] 添加 loading.tsx / error.tsx / not-found.tsx 页面
- [ ] SEO优化: 各页面Metadata, Open Graph标签
- [ ] 动画效果: 页面过渡、卡片hover、滚动揭示(CSS/framer-motion)
- [ ] 性能优化: next/image图片优化, 懒加载
- [x] 创建生产环境 Dockerfile(多阶段构建, standalone)
- [x] 创建生产环境 docker-compose.yml(App + PostgreSQL)
- [x] 创建部署脚本 `scripts/deploy.sh`
- [x] 服务器配置nginx反向代理(3002 -> 3000, SSL)
- [ ] 部署到 124.222.88.69, 验证 zilky7777.cn 可访问
- [ ] 全功能手动测试
- [ ] 生产数据库种子数据填充

---

## 8. Docker 配置

### 8.1 开发环境 docker-compose.dev.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: travel
      POSTGRES_PASSWORD: travel_secret
      POSTGRES_DB: travel_db
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U travel"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_dev_data:
```

### 8.2 生产环境 docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://travel:travel_secret@postgres:5432/travel_db
      - NEXTAUTH_URL=https://zilky7777.cn
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - DEEPSEEK_BASE_URL=https://api.deepseek.com
      - NEXT_PUBLIC_BAIDU_MAP_AK=wmLUPRgtlIWlpCBSfdL9yM7rq0brHmwR
    volumes:
      - uploads_data:/app/public/uploads
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: travel
      POSTGRES_PASSWORD: travel_secret
      POSTGRES_DB: travel_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U travel"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  uploads_data:

networks:
  app-network:
    driver: bridge
```

---

## 9. 环境变量

### .env.local (本地开发)

```
DATABASE_URL=postgresql://travel:travel_secret@localhost:5432/travel_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
DEEPSEEK_API_KEY=sk-074e742a1e004208aa55673316c0b0e5
DEEPSEEK_BASE_URL=https://api.deepseek.com
NEXT_PUBLIC_BAIDU_MAP_AK=wmLUPRgtlIWlpCBSfdL9yM7rq0brHmwR
```

### .env.production (生产环境)

```
DATABASE_URL=postgresql://travel:travel_secret@postgres:5432/travel_db
NEXTAUTH_URL=https://zilky7777.cn
NEXTAUTH_SECRET=<用 openssl rand -base64 32 生成>
DEEPSEEK_API_KEY=sk-074e742a1e004208aa55673316c0b0e5
DEEPSEEK_BASE_URL=https://api.deepseek.com
NEXT_PUBLIC_BAIDU_MAP_AK=wmLUPRgtlIWlpCBSfdL9yM7rq0brHmwR
```

---

## 10. 关键技术决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 百度地图加载 | next/dynamic + ssr:false | 避免服务端渲染报错 |
| 图片存储 | public/uploads/ + Docker Volume | MVP简单可靠, 后续迁移COS |
| AI流式输出 | ReadableStream API | 用户体验好, 逐字展示 |
| 社媒解析 | URL抓取 + 手动粘贴双模式 | URL可能被反爬, 手动粘贴作为保底 |
| 管理路由保护 | Next.js middleware | 统一拦截, 无需每个页面单独判断 |
| 端口映射 | 容器3000 -> 宿主机3002 | nginx反代zilky7777.cn:443到3002 |

---

## 11. 验收标准

- [ ] 管理后台可CRUD全部7类数据
- [ ] 公开页面在手机端(375px)和桌面端(1440px)正常显示
- [ ] 百度地图在景点页和机位页正确展示标注点
- [ ] AI攻略生成可输出中文旅行/摄影攻略
- [ ] 社媒导入(至少手动粘贴+AI解析)可生成结构化机位数据
- [ ] 用户可注册、登录、访问受保护功能
- [ ] 管理员可登录管理后台管理所有内容
- [ ] 应用部署在 zilky7777.cn 可正常访问
- [ ] 页面加载时间 < 3秒
- [ ] 整体视觉完成度高, 动画过渡流畅

---

## 12. 进度日志

| 日期 | 阶段 | 状态 | 备注 |
|------|------|------|------|
| 2026-05-03 | Planning | 完成 | 开发计划创建 |
| 2026-05-03 | Phase 1 | 完成 | 项目初始化+Docker+数据库+Schema+种子数据 |
| 2026-05-03 | Phase 2 | 进行中 | 核心CRUD+照片管理完成, 通用组件/用户管理待做 |
| 2026-05-03 | Phase 3 | 进行中 | 公开页面+百度地图完成, 照片画廊/骨架屏待做 |
| 2026-05-03 | Phase 4 | 进行中 | AI攻略核心完成, 历史/管理/错误处理待做 |
| 2026-05-03 | Phase 7 | 进行中 | Dockerfile+docker-compose+nginx+deploy.sh完成, 部署待执行 |
| 2026-05-03 | Phase 5 | 完成 | 社媒导入全部完成: 解析库/API/前端/管理审核/审核转机位 |
| 2026-05-03 | Phase 6 | 完成 | Auth.js v5认证: 登录/注册/JWT/中间件/admin保护/API保护 |
