# Implementation Plan - 用户照片上传发布功能

## Phase 1: 数据库 + API基础

### T1.1 新增 user_posts 表
- [ ] 在 schema.ts 添加 userPosts 表定义
- [ ] 添加 relations
- [ ] 创建 migration 并执行
- [ ] 验收: 表存在且可读写

### T1.2 GPS匹配API
- [ ] 创建 GET /api/locations/nearby?lat=xx&lng=xx
- [ ] Haversine距离计算,返回5km内最近景点+1km内机位
- [ ] 验收: 传入外滩坐标能返回外滩景点

### T1.3 用户发布API
- [ ] 创建 POST /api/user-posts
- [ ] 接收: photos[], attractionId, spotId?, description, lat?, lng?
- [ ] 存入 user_posts 表
- [ ] 验收: 能成功创建发布记录

---

## Phase 2: 前端发布页

### T2.1 安装 exifreader
- [ ] npm install exifreader
- [ ] 验收: 包可用

### T2.2 照片上传组件
- [ ] 创建 /publish 页面
- [ ] 多图选择(1-9张)+预览+删除
- [ ] 上传到 /api/photos/upload
- [ ] 验收: 能选择多张图并预览

### T2.3 EXIF GPS提取
- [ ] 上传第一张图时读取EXIF GPS
- [ ] 有GPS: 调用 /api/locations/nearby 自动匹配
- [ ] 展示匹配结果,用户可确认或修改
- [ ] 验收: 带GPS的照片能自动匹配到景点

### T2.4 手动选择器
- [ ] 无GPS或用户点"修改"时展示三级选择
- [ ] 城市(已发布) -> 景点 -> 机位(可选)
- [ ] 验收: 三级联动正常工作

### T2.5 发布提交
- [ ] 填写描述
- [ ] 点击发布调用 POST /api/user-posts
- [ ] 成功后跳转或提示
- [ ] 验收: 完整流程走通

---

## Phase 3: AI静默验证

### T3.1 小米Vision API封装
- [ ] 创建 src/lib/xiaomi-ai.ts
- [ ] OpenAI兼容协议,支持发送图片URL
- [ ] 验收: 能调用并返回结果

### T3.2 验证逻辑
- [ ] 发布成功后异步触发AI验证
- [ ] 发送照片+景点名+机位名,判断是否匹配
- [ ] 结果写入 user_posts.ai_verified + ai_result
- [ ] 验收: 发布后ai_verified从pending变为结果

---

## Phase 4: 管理后台 + 导航

### T4.1 管理后台查看
- [ ] /admin/user-posts 页面
- [ ] 展示所有用户发布,含AI验证状态
- [ ] 验收: 管理员能看到发布列表和AI结果

### T4.2 导航入口
- [ ] 首页/导航添加"发布"入口
- [ ] 验收: 用户能找到发布入口

---

## Phase 5: 部署

### T5.1 部署到腾讯云
- [ ] Docker重建
- [ ] migration执行
- [ ] 线上验证
- [ ] 验收: travel.zilky7777.cn 发布功能可用

---

## Workflow Checkpoint
**当Phase 1-4完成后:**
1. 创建 TEST_PLAN.md
2. 停下等待Human审核

## Progress Log
| Date       | Phase    | Status      | Notes                       |
| ---------- | -------- | ----------- | --------------------------- |
| 2026-05-10 | Planning | In Progress | PRD和计划创建完成           |
