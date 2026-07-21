# PRD - 用户照片上传发布功能

## 1. 产品概述

用户可以上传自己拍的照片并关联到景点/机位,丰富平台内容。
系统通过照片EXIF GPS自动匹配位置,无GPS时手动选择。
上传后后台静默AI验证照片与位置是否匹配。

## 2. 用户流程

```
[选择照片] -> [读EXIF GPS] -> {有GPS?}
                                 |
                  Yes: 自动匹配景点/机位,用户确认
                  No:  手动选 城市->景点->机位(可选)
                                 |
                          [填写描述] -> [发布]
                                          |
                               [后台静默AI验证]
```

## 3. 功能详情

### 3.1 照片上传(前端)
- 支持选择1-9张照片
- 预览缩略图,支持删除
- 前端用 exifreader 读取第一张照片的GPS坐标
- 照片通过 FormData 上传到 /api/photos/upload

### 3.2 GPS自动匹配(后端API)
- 新增 GET /api/locations/nearby?lat=xx&lng=xx
- 用 Haversine 公式计算距离
- 返回最近的景点(5km内)和该景点下的机位(1km内)
- 前端展示匹配结果,用户可确认或手动修改

### 3.3 手动选择(前端)
- 无GPS或用户想修改时,展示三级联动选择器
- 城市列表(已发布) -> 该城市的景点列表 -> 该景点的机位列表(可选)
- 机位可不选,表示"景点级别"的照片

### 3.4 发布提交(后端API)
- 新增 POST /api/user-posts
- 存储: 用户ID,照片URLs,景点ID,机位ID(可选),描述,GPS坐标
- 新建 user_posts 表
- 发布后触发AI验证(异步,不阻塞用户)

### 3.5 AI验证(后端,静默)
- 调用小米API(OpenAI兼容,支持vision)
- 发送照片+景点名+机位名,问AI是否匹配
- 结果(match/mismatch/uncertain)写入 user_posts.ai_verification
- 管理员在后台可查看

## 4. 数据模型

### 新增表: user_posts
```
id            serial PK
user_id       uuid FK -> users (可null,允许匿名)
attraction_id integer FK -> attractions
spot_id       integer FK -> spots (可null)
description   text
photos        jsonb (照片URL数组)
latitude      decimal
longitude     decimal
ai_verified   varchar(20) default 'pending'
ai_result     jsonb (AI返回的详细结果)
status        varchar(20) default 'published'
created_at    timestamp
```

## 5. API设计

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/locations/nearby | GET | GPS匹配最近景点/机位 |
| /api/user-posts | POST | 创建用户发布 |
| /api/user-posts | GET | 获取用户发布列表 |
| /api/admin/user-posts | GET | 管理员查看所有发布 |

## 6. 页面

### 6.1 发布页 /publish
```
+------------------------------------------+
| < 返回                    发布            |
|                                          |
| +------+ +------+ +------+ +------+     |
| | 照片1 | | 照片2 | | 照片3 | | +添加 |   |
| +------+ +------+ +------+ +------+     |
|                                          |
| [GPS已定位: 外滩 - 外滩观景台]  [修改]    |
|  或                                      |
| [城市] v  [景点] v  [机位(可选)] v        |
|                                          |
| 描述:                                    |
| +--------------------------------------+ |
| | 在这里写点什么...                       | |
| +--------------------------------------+ |
|                                          |
| [发布]                                   |
+------------------------------------------+
```

## 7. 技术选型

- EXIF读取: exifreader (前端npm包,轻量,支持GPS)
- 文件上传: 现有 /api/photos/upload
- AI验证: 小米API (OpenAI vision兼容)
- 距离计算: SQL Haversine公式
