# Implementation Plan - v2 景点为核心重构

## Phase 1: 数据库调整 + 数据重新处理

### T1.1 数据库Schema调整
- [ ] attractions表增加 hot_score (integer) 和 spots_count (integer) 字段
- [ ] 创建migration并执行
- [ ] **验收**: 新字段存在且可读写

### T1.2 重写数据处理脚本
- [ ] 修改 process_data.py: 按景点名聚合多条笔记
- [ ] 同一景点的多条笔记合并为一个attraction + 多个spot
- [ ] 输出格式: { attractionName, cityName, spots: [{name, desc, images, tips}] }
- [ ] **验收**: processed_data.json中景点数 < 笔记数(有聚合)

### T1.3 重写数据导入脚本
- [ ] 修改 import-xhs-data.ts 适配新的聚合数据格式
- [ ] 每个attraction设置封面图(取最佳样片)
- [ ] 每个attraction下创建多个spot机位
- [ ] 更新spots_count缓存字段
- [ ] **验收**: DB中attraction数量合理，每个attraction下有多个spots

---

## Phase 2: 首页重写 - 景点瀑布流

### T2.1 景点Feed API
- [ ] 创建 GET /api/attractions/feed?city=xxx
- [ ] 返回: id, name, cityName, coverImage, spotsCount, hotScore
- [ ] 支持城市筛选，按hotScore排序
- [ ] **验收**: API返回景点列表，含封面图和机位数

### T2.2 首页UI - 城市筛选栏 + 瀑布流
- [ ] 顶部横向滑动城市标签(全部/上海/杭州/成都/北京/厦门)
- [ ] 双列瀑布流景点卡片
- [ ] 卡片: 封面大图 + 景点名 + 城市 + 机位数
- [ ] 点击跳转 /attraction/[id]
- [ ] **验收**: 首页展示景点卡片，城市筛选正常工作

---

## Phase 3: 景点详情页

### T3.1 景点详情API
- [ ] 创建 GET /api/attractions/[id]/detail
- [ ] 返回: 景点信息 + 该景点下所有spots(含photos)
- [ ] **验收**: API返回完整的景点+机位+样片数据

### T3.2 景点详情页UI
- [ ] Hero区: 封面大图 + 名称 + 城市 + 简介
- [ ] 机位列表: 卡片形式展示每个spot
- [ ] 每个机位卡片: 样片横滑 + 机位名 + 构图/穿搭建议
- [ ] 底部: 百度地图显示景点位置
- [ ] **验收**: 进入景点后能看到多个机位和样片

---

## Phase 4: 地图页调整

### T4.1 修改出片地图
- [ ] 地图标记改为景点(不是单个机位)
- [ ] 点击景点弹窗: 封面+名称+机位数 -> 跳转详情
- [ ] 保留城市轮廓功能
- [ ] **验收**: 地图上显示景点标记，点击可进入详情

---

## Phase 5: 导航 + 收尾

### T5.1 导航和Header调整
- [ ] Header: 首页(景点发现) / 出片地图 / AI攻略
- [ ] 移除旧的城市列表入口
- [ ] **验收**: 导航清晰，各页面可达

### T5.2 清理旧页面
- [ ] 删除/重定向旧的 /city/[id] 页面
- [ ] 删除/重定向旧的 /spot/[id] 页面(可保留,作为机位独立页)
- [ ] **验收**: 无死链

### T5.3 部署到腾讯云
- [ ] Docker重新构建
- [ ] 数据库migration + 数据重新导入
- [ ] 验证 travel.zilky7777.cn 正常
- [ ] **验收**: 线上可访问，功能正常

---

## Workflow Checkpoint
**当所有Phase 1-5完成后:**
1. 创建 TEST_PLAN.md
2. 停下等待Human审核

## Progress Log
| Date       | Phase   | Status      | Notes                |
| ---------- | ------- | ----------- | -------------------- |
| 2026-05-07 | Planning | Complete   | v2 plan created      |
