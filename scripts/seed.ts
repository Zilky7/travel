import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://travel:travel_secret@localhost:5432/travel_db";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // -- Admin user --
  const passwordHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "admin@zilky7777.cn",
      passwordHash,
      name: "Admin",
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  if (admin) {
    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  // -- Cities --
  const cityRows = await db
    .insert(schema.cities)
    .values([
      { name: "成都", nameEn: "Chengdu", description: "天府之国, 美食与熊猫之都。成都的慢生活节奏和丰富的文化底蕴让这里成为出片圣地。", province: "四川", latitude: "30.5728900", longitude: "104.0668200", sortOrder: 1 },
      { name: "大理", nameEn: "Dali", description: "风花雪月, 文艺与浪漫的代名词。苍山洱海间, 每一帧都是壁纸级风景。", province: "云南", latitude: "25.6065200", longitude: "100.2675900", sortOrder: 2 },
      { name: "上海", nameEn: "Shanghai", description: "魔都的万种风情, 从外滩的万国建筑到弄堂的市井烟火, 每个转角都是大片。", province: "上海", latitude: "31.2304000", longitude: "121.4737000", sortOrder: 3 },
      { name: "北京", nameEn: "Beijing", description: "千年帝都, 故宫红墙与胡同光影交织, 古典与现代碰撞的摄影天堂。", province: "北京", latitude: "39.9042000", longitude: "116.4074000", sortOrder: 4 },
      { name: "南京", nameEn: "Nanjing", description: "六朝古都, 梧桐大道与民国建筑, 文艺气息浓厚的出片宝地。", province: "江苏", latitude: "32.0603000", longitude: "118.7969000", sortOrder: 5 },
      { name: "杭州", nameEn: "Hangzhou", description: "人间天堂, 西湖的四季变换和江南水乡的温婉, 处处入画。", province: "浙江", latitude: "30.2741000", longitude: "120.1551000", sortOrder: 6 },
      { name: "重庆", nameEn: "Chongqing", description: "8D魔幻城市, 层层叠叠的山城夜景和赛博朋克感, 出片率极高。", province: "重庆", latitude: "29.5630000", longitude: "106.5516000", sortOrder: 7 },
      { name: "西安", nameEn: "Xi-an", description: "十三朝古都, 大唐盛世的光影重现, 汉服出片的绝佳目的地。", province: "陕西", latitude: "34.3416000", longitude: "108.9398000", sortOrder: 8 },
      { name: "厦门", nameEn: "Xiamen", description: "海滨花园城市, 鼓浪屿的小清新与环岛路的海风, 治愈系出片圣地。", province: "福建", latitude: "24.4798000", longitude: "118.0894000", sortOrder: 9 },
      { name: "丽江", nameEn: "Lijiang", description: "雪山下的古城, 纳西风情与玉龙雪山的壮美, 每一帧都是壁纸。", province: "云南", latitude: "26.8721000", longitude: "100.2299000", sortOrder: 10 },
    ])
    .returning();

  const cityMap = Object.fromEntries(cityRows.map((c) => [c.name, c.id]));
  console.log(`Created ${cityRows.length} cities`);

  // -- Attractions --
  const attrRows = await db
    .insert(schema.attractions)
    .values([
      {
        cityId: cityMap["成都"],
        name: "宽窄巷子",
        description: "成都最具代表性的历史文化街区, 青砖灰瓦间藏着无数出片角落。",
        address: "成都市青羊区宽窄巷子",
        latitude: "30.6697900",
        longitude: "104.0554800",
        openHours: "全天开放, 店铺营业时间约 09:00-22:00",
        ticketInfo: "免费",
        tips: "建议避开国假高峰, 工作日上午人少适合拍照。",
        sortOrder: 1,
      },
      {
        cityId: cityMap["成都"],
        name: "武侯祠",
        description: "三国文化圣地, 红墙竹影是成都最经典的出片场景之一。",
        address: "成都市武侯区武侯祠大街231号",
        latitude: "30.6458100",
        longitude: "104.0479100",
        openHours: "08:00-20:00(夏季) / 08:00-18:30(冬季)",
        ticketInfo: "50元",
        tips: "红墙竹影在南郊公园侧门免费区域即可拍到。",
        sortOrder: 2,
      },
      {
        cityId: cityMap["大理"],
        name: "洱海",
        description: "大理的灵魂所在, 环海公路沿线处处是拍照打卡点。",
        address: "大理白族自治州大理市",
        latitude: "25.7295000",
        longitude: "100.1826000",
        openHours: "全天开放",
        ticketInfo: "免费(部分码头收费)",
        tips: "环海骑行是最佳游览方式, 东岸日出西岸日落。",
        sortOrder: 1,
      },
    ])
    .returning();

  const attrMap = Object.fromEntries(attrRows.map((a) => [a.name, a.id]));
  console.log(`Created ${attrRows.length} attractions`);

  // -- Spots --
  const insertedSpots = await db
    .insert(schema.spots)
    .values([
      {
        attractionId: attrMap["宽窄巷子"],
        name: "宽巷子入口牌坊",
        description: "标志性的牌坊大门, 古色古香的背景非常适合汉服和旗袍写真。",
        latitude: "30.6700500",
        longitude: "104.0555200",
        bestTime: "上午 8:00-10:00 (人少光线柔和)",
        bestSeason: "春季(3-4月)樱花期 / 秋季(10-11月)银杏季",
        lightDirection: "上午正面顺光, 适合人像",
        compositionTips: "低角度仰拍, 将牌坊完整纳入画面, 人物居中偏左",
        outfitTips: "白色/浅色汉服或旗袍, 与青灰色建筑形成对比",
        photoTips: "使用35mm-50mm焦段, 光圈f/2.8虚化背景行人",
        difficulty: "easy",
        sortOrder: 1,
      },
      {
        attractionId: attrMap["武侯祠"],
        name: "红墙竹影",
        description: "武侯祠标志性的红墙夹道, 两侧翠竹掩映, 是成都出片率最高的场景。",
        latitude: "30.6452300",
        longitude: "104.0473800",
        bestTime: "下午 14:00-16:00 (光线透过竹叶形成光斑)",
        bestSeason: "四季皆宜, 夏季竹叶最茂盛",
        lightDirection: "下午侧光, 红墙上会有竹影斑驳",
        compositionTips: "利用红墙延伸线构图, 人物放在三分之一处, 纵深感强",
        outfitTips: "白色连衣裙最经典; 也可选墨绿/藏蓝色与红墙撞色",
        photoTips: "竖构图更佳, 85mm焦段压缩空间感, 注意红色不要过曝",
        difficulty: "easy",
        sortOrder: 1,
      },
      {
        attractionId: attrMap["洱海"],
        name: "双廊古镇观景台",
        description: "远眺洱海全景的绝佳位置, 苍山洱海尽收眼底。",
        latitude: "25.8530000",
        longitude: "100.1870000",
        bestTime: "日落前1小时 17:00-18:30",
        bestSeason: "秋冬季(10-2月)天空通透, 云层丰富",
        lightDirection: "日落时逆光, 适合剪影和golden hour人像",
        compositionTips: "将洱海水面作为前景, 苍山作为背景, 人物剪影置于黄金分割点",
        outfitTips: "飘逸长裙(白色/红色), 日落逆光下裙摆透光效果绝佳",
        photoTips: "逆光拍摄注意对人脸补光或拍剪影; 手机用HDR模式",
        difficulty: "easy",
        sortOrder: 1,
      },
      {
        attractionId: attrMap["洱海"],
        name: "海舌生态公园",
        description: "深入洱海的半岛湿地, 枯树与湖水构成极简风光大片。",
        latitude: "25.7890000",
        longitude: "100.0950000",
        bestTime: "上午 7:00-9:00 (晨雾+日出)",
        bestSeason: "冬季(12-2月)枯树+候鸟, 画面感最强",
        lightDirection: "清晨东面日出顺光",
        compositionTips: "利用枯树做前景框架, 极简构图留大面积天空和水面",
        outfitTips: "纯色大衣(驼色/黑色)走文艺冷淡风, 与枯树意境契合",
        photoTips: "广角拍大场景, 也可长焦压缩枯树与远山的距离感",
        difficulty: "medium",
        sortOrder: 2,
      },
    ])
    .returning();

  console.log(`Created ${insertedSpots.length} spots`);

  await client.end();
  console.log("Seed completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
