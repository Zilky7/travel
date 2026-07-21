# Changelog

所有改动记录，方便其他终端了解进度。

---

## 2026-05-10

### Session: 2026-05-10 数据预处理清洗(景点-机位-图片对应)

#### 数据分析与分类
- [x] 发现核心问题: 138个"机位"全是XHS帖子标题,不是真实拍照位置
- [x] 分析上海78篇帖子: 42个Type A(单机位) + 37个Type B(多机位攻略)
- [x] 分析其他城市59篇帖子: 29个Type A + 22个Type B + 8个Type C(无效)
- [x] 识别7个需重分类帖子(如虹书舫从外滩移到苏州河)
- [x] 识别5个模糊景点名需修正(成都综合/成都公园/厦门公园等)
- [x] 生成帖子分类映射文件: shanghai_mapping.json + other_cities_mapping.json

#### 预处理脚本开发
- [x] 创建 scripts/xhs/preprocess.ts: 读取cleaned_data+mapping生成final_clean_data
- [x] 创建 scripts/xhs/validate.ts: 校验景点-机位-图片对应关系
- [x] 创建 scripts/import-xhs-data-v2.ts: 支持新数据格式(spot_id可为null)
- [x] 修复imageGroups数据结构: 合并同名机位时保持各帖子独立的localDir
- [x] 数据校验通过: 0错误0警告, 1446张图片全部存在

#### 清洗结果
- 37个景点(从40个去掉6个空景点+新增3个重分类)
- 42个真实机位(19个上海+23个其他城市)
- 59组景点级图片(Type B帖子)
- 1446张有效图片(去掉70张Type C无效帖的)
- 上海: 11景点/19机位/861图 [已发布]
- 其他: 26景点/23机位/585图 [隐藏,后台可切换]

#### 前端适配
- [x] 城市筛选栏只显示已发布城市 (首页动态拉取 /api/cities?published=true)
- [x] Feed API 也只返回已发布城市的景点 (添加 cities.isPublished 过滤)
- [x] 景点详情页分两块: 机位图(按spot分组) + 更多样片(spot_id为null的景点级图)
- [x] 管理后台城市发布开关 (toggle组件, 调用 PUT /api/cities/:id)

#### 部署
- [x] Docker重建+数据导入+图片同步
- [x] 线上验证: 11个上海景点, 42个真实机位, 1446张图片, API正常, 图片200
- [x] 修复NEXTAUTH_SECRET缺失导致登录报Server error (服务器.env补全)
- [x] 修复用户密码hash被shell $符号截断问题 (改为服务器本地生成hash)
- [x] 重置管理员密码: admin@zilky7777.cn / 111
- [x] 创建测试用户: test1@zilky7777.cn / 111

#### 用户照片发布功能
- [x] 新增 user_posts 表(schema + migration)
- [x] GPS匹配API: GET /api/locations/nearby (Haversine 5km内匹配)
- [x] 用户发布API: POST /api/user-posts
- [x] 前端发布页 /publish (多图上传+EXIF GPS+三级联动选择)
- [x] 小米Vision API封装 src/lib/xiaomi-ai.ts
- [x] AI静默验证: 发布后异步调用AI判断照片与景点是否匹配
- [x] 管理后台 /admin/user-posts (查看发布+AI验证状态)
- [x] 导航栏添加"发布"入口
- [x] 部署到腾讯云(镜像+migration+环境变量+docker-compose修正)
- [x] AI验证修复: mimo-v2.5模型(支持vision) + base64编码 + 文件路径读取
- [x] 端到端验证通过: 上传->发布->AI验证(yes, 95%置信度)
- [x] 浏览器定位: 打开发布页自动请求设备GPS, 存入device_latitude/device_longitude, 仅管理员可见

#### UI优化
- [x] 手机端导航: 汉堡菜单改为底部固定tab栏(社区/机位/发布/地图/攻略), 发布按钮居中突出
- [x] 社区页: 删除"关注/推荐"分类栏, 直接展示内容
- [x] 底部间距: 手机端内容区加pb-14避免被tab栏遮挡
- [x] 出片地图: 城市列表从硬编码改为动态获取已发布城市, 地图API加cities.isPublished过滤
- [x] 机位描述: AI重写42个机位描述(去掉小红书原文, 生成简洁拍照建议)
- [x] 图片部署修复: nginx不能alias到Docker volume(权限链不通), 改用docker cp到/home/ubuntu/travel-uploads/

#### 下次接手提示
- 当前状态: 用户发布功能+UI优化已完成并部署
- 管理后台: https://travel.zilky7777.cn/admin/cities (admin@zilky7777.cn / 111)
- 测试用户: test1@zilky7777.cn / 111
- 服务器.env: NEXTAUTH_SECRET + DEEPSEEK_API_KEY + XIAOMI_API_KEY 已配置
- nginx图片: xhs图片从/home/ubuntu/xhs_images/ serve, 用户上传从docker volume serve
- 每次部署后需执行: docker cp travel-app-1:/app/public/uploads/. /home/ubuntu/travel-uploads/
- "上海公园(待确认)" 景点名需手动确认具体是哪个公园

---

## 2026-05-09

### Session: 2026-05-09 数据质量清洗

#### 数据梳理与清洗
- [x] 全量数据审计: 56个景点, 138机位, 1516张图片(全部存在,无缺失)
- [x] AI修正异常景点名称: 36个脏名称全部修正(AI识别18个 + 手动映射18个)
- [x] 合并重复景点: 15个重复条目合并(56->41个景点), 例如多个武康路/迪士尼/鼓浪屿条目合并
- [x] Nominatim地理编码: 40个景点获取真实经纬度(替代之前的随机偏移坐标)
- [x] 手动坐标补充: 14个Nominatim查不到的景点用手动坐标覆盖
- [x] 最终数据: 40个景点, 138机位, 1516张图片, 0数据问题

#### 清洗脚本
- [x] 创建 scripts/xhs/clean_data.py (AI识别+合并+地理编码一体化)
- [x] 输出 scripts/xhs/data/cleaned_data.json (可直接用于重新导入)

#### 名称修正示例
- "夜晚路过了淮海中路上公主的家......" -> 武康大楼
- "成都一不小心get了迪丽热巴同款机位" -> IFS熊猫
- "震惊! 杭州的艺术馆已经美到next level" -> 中国美术学院
- "就这个胶片味儿，一秒变身富家子弟" -> 武康路
- 多个武康路相关条目合并为1个(5机位)

#### 下次接手提示
- 当前状态: 清洗数据已导入数据库并部署到腾讯云, travel.zilky7777.cn 已上线
- 数据库: 40景点, 138机位, 1516图片, 全部真实坐标
- 注意: 百度地图API key已被禁用, 改用Nominatim+手动坐标方案
- 小米API需要trust_env=False绕过公司代理, Nominatim则需要走代理

#### 数据库重导入与部署
- [x] 修改 import-xhs-data.ts 读取 cleaned_data.json
- [x] 本地数据库清理旧数据(1788图片+160机位+56景点)并重新导入
- [x] 构建新Docker镜像(DOCKER_BUILDKIT=0绕过registry不通问题)
- [x] 镜像+uploads包传输到腾讯云服务器
- [x] 服务器pg_dump/pg_restore方式同步数据库
- [x] 服务器uploads目录替换(1516张图片)
- [x] travel-app-1容器重建并验证
- [x] 端到端验证: 首页200, 图片200, 数据正确

### Session: 2026-05-04 ~ 2026-05-09 (跨多天大会话)

#### Phase 1: 小红书数据爬取基础设施
- [x] 克隆并配置 Spider_XHS 爬虫工具 (/home/zilky7/zhengyu/zilky7/tools/spider-xhs)
- [x] 创建批量爬取脚本 scripts/xhs/batch_scrape.py
- [x] 首批爬取5城市(上海/杭州/成都/北京/厦门) 75条笔记
- [x] 追加爬取上海数据 63条新笔记, 总计上海79条
- [x] 数据上传到腾讯云服务器

#### Phase 2: 数据处理与导入
- [x] 创建 process_data.py - 按景点聚合多条笔记
- [x] 接入小米MiMo API (mimo-v2.5-pro) 做多景点笔记拆分
- [x] AI文案拆分: 从笔记文案中提取每个机位的独立出片建议
- [x] 创建 import-xhs-data.ts - 导入聚合数据到PostgreSQL
- [x] 最终数据: 56个景点, 160个机位, 2275张photos

#### Phase 3: v2重构 - 以景点为核心 (参考可颂App)
- [x] attractions表增加 hot_score, spots_count 字段
- [x] 重写首页: 景点列表(城市选择+搜索+排序+横滑样片)
- [x] 重写景点详情页: Hero大图轮播 + 3列机位网格
- [x] 重写机位详情页: 大图轮播 + 缩略图横滑 + 出片建议
- [x] 创建社区页 /community: 小红书风格双列瀑布流大图
- [x] 出片地图: 定位优先+城市切换(非全国地图)
- [x] 地图城市轮廓: hover显示边界, 点击轮廓区域可进入
- [x] 所有页面PC端适配 (响应式列数: 2/3/4/5列)

#### Phase 4: 部署与配置
- [x] travel.zilky7777.cn SSL证书部署
- [x] nginx子域名配置
- [x] Docker镜像构建+部署
- [x] 服务器磁盘清理 (docker system prune 释放25GB)

#### 导航结构
- 社区 (/community) - 瀑布流大图
- 机位 (/) - 景点列表
- 出片地图 (/explore) - 城市地图
- AI攻略 (/guide)

#### 下次接手提示
- 当前状态: 全部功能已部署上线, travel.zilky7777.cn 可访问
- 待优化: 百度地图Geocoding API未开通(坐标用随机偏移), 部分景点名需要人工优化
- 小米API key已更新: tp-c4zqvc6qjyyrghtn4ng95yq9dxa4osbngioxpzcrw0daqafm
- 下一步: 可扩充更多城市数据, 优化景点名称提取精度, 增加用户交互功能

---

## 2026-05-07

### Phase 0: 项目配置 + Schema变更
- 创建 CHANGELOG.md
- 更新 CLAUDE.md 添加changelog写入规则
- photos表新增字段: source_platform, source_url, source_author
- 执行数据库迁移
