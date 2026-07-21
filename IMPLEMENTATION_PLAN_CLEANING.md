# Implementation Plan - XHS数据预处理清洗

## Phase 1: 数据分析与映射文件生成

### T1.1 分析所有帖子并生成 post_mapping.json
- [ ] 逐个分析上海11个景点的帖子内容
- [ ] 逐个分析杭州/厦门/北京/成都的帖子内容
- [ ] 将每个帖子分类为 Type A(单机位)/B(多机位攻略)/C(无效)
- [ ] Type A帖子标注真实机位名称(spotName)
- [ ] 输出 `scripts/xhs/data/post_mapping.json`
- [ ] **验收**: 138个帖子全部分类完成

### T1.2 景点名清理映射
- [ ] 确定"成都综合"/"成都公园"/"上海公园"/"厦门公园"的真实名称
- [ ] 确定"陆家嘴"下帖子的正确归属
- [ ] 输出景点重命名/重分配映射到 post_mapping.json 中
- [ ] **验收**: 无模糊景点名

---

## Phase 2: 预处理脚本开发

### T2.1 编写预处理脚本
- [ ] 创建 `scripts/xhs/preprocess.ts`
- [ ] 读取 cleaned_data.json + post_mapping.json
- [ ] 按mapping执行: Type A -> 建spot, Type B -> 图片挂attraction, Type C -> 跳过
- [ ] 清洗描述文本(去hashtag/emoji垃圾/广告内容)
- [ ] 输出 `scripts/xhs/data/final_clean_data.json`
- [ ] **验收**: 输出数据满足景点-机位-图片对应关系

### T2.2 数据校验脚本
- [ ] 创建 `scripts/xhs/validate.ts`
- [ ] 检查: 每张图片必须有attraction_id
- [ ] 检查: Type A帖子的图片必须有spot_id
- [ ] 检查: Type B帖子的图片spot_id必须为null
- [ ] 检查: 无孤儿记录
- [ ] 输出校验报告
- [ ] **验收**: 校验通过,0错误

---

## Phase 3: 数据库更新

### T3.1 更新导入脚本
- [ ] 修改 `scripts/import-xhs-data.ts` 适配新数据格式
- [ ] 支持spot_id可为null的图片导入
- [ ] 导入前清空旧的attractions/spots/photos数据
- [ ] 更新attractions的spots_count字段
- [ ] **验收**: 本地可成功导入

### T3.2 城市发布控制
- [ ] 确认cities表 is_published 字段可用
- [ ] 上海设为 is_published=true
- [ ] 其他城市设为 is_published=false
- [ ] **验收**: 数据库中城市发布状态正确

---

## Phase 4: 前端适配

### T4.1 城市筛选栏适配
- [ ] 首页API只返回 is_published=true 的城市
- [ ] 城市筛选栏动态渲染(不硬编码城市列表)
- [ ] **验收**: 首页只显示上海

### T4.2 景点详情页适配
- [ ] 机位区域: 显示有spot_id的图片按机位分组
- [ ] 新增"更多样片"区域: 显示spot_id为null但attraction_id匹配的图片
- [ ] **验收**: 两种图片都正确展示

### T4.3 管理后台城市开关
- [ ] 管理后台增加城市列表页面
- [ ] 每个城市有发布/取消发布开关
- [ ] 切换开关即时更新 is_published
- [ ] **验收**: 后台可切换城市发布状态

---

## Phase 5: 部署到服务器

### T5.1 部署
- [ ] Docker重新构建
- [ ] 数据库migration + 数据导入
- [ ] 图片同步到服务器
- [ ] 验证线上功能
- [ ] **验收**: zilky7777.cn 正常访问,只显示上海数据

---

## Workflow Checkpoint
**当Phase 1-5全部完成后:**
1. 创建 TEST_PLAN.md
2. 停下等待Human审核

## Progress Log
| Date       | Phase    | Status      | Notes                       |
| ---------- | -------- | ----------- | --------------------------- |
| 2026-05-10 | Planning | In Progress | 数据清洗PRD和计划创建完成   |
