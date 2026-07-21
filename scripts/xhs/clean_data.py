"""
Data cleaning script for processed_data.json
Step 1: AI-based attraction name correction
Step 2: Merge duplicate attractions
Step 3: Nominatim geocoding for real coordinates
"""
import json
import os
import re
import time
from collections import defaultdict

import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

XIAOMI_KEY = "tp-c4zqvc6qjyyrghtn4ng95yq9dxa4osbngioxpzcrw0daqafm"
XIAOMI_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions"
XIAOMI_MODEL = "mimo-v2.5-pro"

ai_session = requests.Session()
ai_session.trust_env = False

geo_session = requests.Session()

KNOWN_ATTRACTIONS = {
    "上海": ["外滩", "陆家嘴", "武康大楼", "武康路", "南京路", "迪士尼",
             "豫园", "城隍庙", "淮海路", "苏州河", "静安寺", "北外滩",
             "华东政法大学", "田子坊", "新天地", "人民广场", "东方明珠"],
    "成都": ["宽窄巷子", "武侯祠", "锦里", "春熙路", "太古里",
             "天府广场", "交子之环", "文殊院", "人民公园", "望江楼"],
    "北京": ["故宫", "天坛", "颐和园", "长城", "天安门", "南锣鼓巷",
             "景山公园", "北海公园", "中央电视塔", "什刹海"],
    "杭州": ["西湖", "灵隐寺", "青山湖", "千岛湖", "西溪湿地",
             "中国美术学院", "良渚"],
    "厦门": ["鼓浪屿", "曾厝垵", "环岛路", "南普陀寺", "厦门大学",
             "中山路", "沙坡尾", "植物园"],
}


def ai_call(system_msg, user_msg, max_tokens=2000):
    """Call Xiaomi AI API (direct, no proxy)."""
    try:
        resp = ai_session.post(XIAOMI_URL, json={
            "model": XIAOMI_MODEL,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            "max_tokens": max_tokens, "temperature": 0.1
        }, headers={"Authorization": f"Bearer {XIAOMI_KEY}"}, timeout=60)
        data = resp.json()
        return data['choices'][0]['message'].get('content', '').strip()
    except Exception as e:
        print(f"  AI error: {e}")
        return None


MANUAL_NAME_MAP = {
    "厦门:厦门小记 欢迎登陆我的视角\U0001f490": "鼓浪屿",
    "北京:P1: 香港-宝马山": "北京胡同",
    "成都:成都最好的地方都是免费的。。。。。。（l": "成都公园",
    "成都:成都｜一不小心get了迪丽热巴同款\U0001f4f7机位": "IFS熊猫",
    "厦门:J人耗时6h整理的厦门2天旅游攻略（手写": "鼓浪屿",
    "北京:京味儿胶片\U0001f39e️": "北京胡同",
    "杭州:\U000136fb\U0001f43b\U0001d568\U0001d556\U0001d556\U0001d55c\U0001d555\U0001d552\U0001d56a\U000136c2\U0001f9f8\U0001f9cb。": "西湖",
    "厦门:为了这18张照片,我特意飞了趟厦门‼️L": "双子塔海滩",
    "成都:一些美式辣妹拍照姿势和角度\U0001f4f7": "春熙路",
    "杭州:P1-2：中国院子·樱花": "西湖",
    "厦门:厦门真的不缺拍照好看的地方\U0001f343": "厦门公园",
    "成都:成都景点锐评｜个人真实感受": "成都综合",
    "上海:上海有自己的言叶之庭": "上海公园",
    "上海:难道我去的是假的武康路？": "武康路",
    "上海:在上海被街拍了…": "武康路",
    "上海:上海终于变暖和啦\U0001f343": "武康路",
    "上海:\U0001f4cd上海city": "武康路",
    "上海:城隍庙腊梅": "城隍庙",
    "厦门:找到一个非常漂亮的小众机位": "环岛路",
    "成都:寻找和我一样喜欢拍“绿色”的人": "成都公园",
    "上海:夜晚路过了淮海中路上公主的家……": "武康大楼",
    "杭州:\U000136fb\U0001f43b\U0001d568\U0001d556\U0001d556\U0001d55c\U0001d555\U0001d552\U0001d56a\U000136c2\U0001f9f8\U0001f9cb。": "西湖",
    "杭州:震惊！杭州的艺术馆已经美到next\xa0le": "中国美术学院",
    "成都:地铁锦城广场东B出口，导航到s": "SKP生机之塔",
    "上海:就这个胶片味儿，一秒变身“富”家子弟": "武康路",
    "杭州:𓛻🐻𝕨𝕖𝕖𝕜𝕕𝕒𝕪𓛂🧸🧋。": "西湖",
    "上海:魔都拍照圣地，极限挑战取景地。": "1933老场坊",
}

MANUAL_COORDS = {
    "成都:IFS熊猫": (30.6572, 104.0808),
    "成都:三星堆": (31.0020, 104.2090),
    "成都:交子之环": (30.5680, 104.0650),
    "成都:SKP生机之塔": (30.5680, 104.0640),
    "成都:成都公园": (30.5730, 104.0670),
    "成都:成都综合": (30.5730, 104.0670),
    "成都:刃具立交绿化带": (30.6880, 104.1000),
    "上海:1933老场坊": (31.2530, 121.4920),
    "上海:上海公园": (31.2300, 121.4740),
    "上海:城隍庙": (31.2277, 121.4925),
    "厦门:双子塔海滩": (24.4960, 118.1100),
    "厦门:厦门公园": (24.4800, 118.0890),
    "北京:北京胡同": (39.9340, 116.4030),
    "杭州:中国美术学院": (30.2455, 120.1559),
}


def is_bad_name(name):
    """Check if attraction name needs fixing."""
    if len(name) > 12:
        return True
    bad_chars = ['!', '|', '⃣', ':', '⸝', '🌳', '💐', '🎞',
                 '🧸', '🧋', '📷', '🏐', '🍃', '‼', '……', '。。']
    for c in bad_chars:
        if c in name:
            return True
    if name in ['无标题', '详细打卡地址']:
        return True
    if name.startswith('P1'):
        return True
    return False


def ai_identify_attraction(city, attraction_name, spots_info):
    """Use AI to identify the correct attraction name."""
    known = KNOWN_ATTRACTIONS.get(city, [])
    spot_names = [s.get("name", "")[:40] for s in spots_info[:5]]
    spot_descs = [s.get("description", "")[:150] for s in spots_info[:3]]

    prompt = (
        f"City: {city}\n"
        f"Current (wrong) name: {attraction_name}\n"
        f"Spot titles: {spot_names}\n"
        f"Spot desc snippets: {spot_descs}\n\n"
        f"Known attractions in {city}: {known}\n\n"
        "The current name is a messy note title, not a real place. "
        "Identify the REAL attraction. If it matches a known one, use that exact name. "
        "Otherwise give a short clean Chinese name (2-8 chars). "
        "Return ONLY the name, nothing else."
    )
    text = ai_call(
        "Identify the real Chinese attraction name. Reply with ONLY the name (2-8 Chinese chars), nothing else.",
        prompt, max_tokens=2000
    )
    if text:
        text = text.strip('"\'').strip()
        text = re.sub(r'["""\'\'`]', '', text)
        if 2 <= len(text) <= 15:
            return text
    return None


def step1_fix_names(data):
    """Fix bad attraction names using manual map + AI fallback."""
    name_map = {}
    fix_count = 0

    for entry in data:
        name = entry['attractionName']
        city = entry['cityName']
        key = f"{city}:{name}"
        if not is_bad_name(name) and key not in MANUAL_NAME_MAP:
            continue
        if key in name_map:
            continue

        print(f"  Fixing: [{city}] {name[:40]}...")
        if key in MANUAL_NAME_MAP:
            new_name = MANUAL_NAME_MAP[key]
            print(f"    -> {new_name} (manual)")
        else:
            new_name = ai_identify_attraction(city, name, entry.get('spots', []))
            time.sleep(2)
            if new_name:
                print(f"    -> {new_name} (AI)")
            else:
                print(f"    -> FAILED, keeping original")

        if new_name:
            name_map[key] = new_name
            print(f"    -> {new_name}")
            fix_count += 1
        else:
            print(f"    -> FAILED, keeping original")

    for entry in data:
        key = f"{entry['cityName']}:{entry['attractionName']}"
        if key in name_map:
            entry['attractionName'] = name_map[key]

    print(f"\n  Fixed {fix_count} attraction names")
    return data, name_map


def step2_merge_duplicates(data):
    """Merge entries with same city+attraction into one."""
    groups = defaultdict(list)
    for entry in data:
        key = f"{entry['cityName']}:{entry['attractionName']}"
        groups[key].append(entry)

    merged = []
    merge_count = 0
    for key, entries in groups.items():
        base = entries[0].copy()
        if len(entries) > 1:
            merge_count += len(entries) - 1
            all_spots = []
            total_hot = 0
            for e in entries:
                all_spots.extend(e.get('spots', []))
                total_hot += e.get('hotScore', 0)
            base['spots'] = all_spots
            base['hotScore'] = total_hot
            best = max(entries, key=lambda x: x.get('hotScore', 0))
            if best.get('description'):
                base['description'] = best['description']
            print(f"  Merged: {key} ({len(entries)} -> 1, {len(all_spots)} spots)")
        merged.append(base)

    merged.sort(key=lambda x: -x.get('hotScore', 0))
    print(f"\n  Merged {merge_count} duplicates, {len(data)} -> {len(merged)}")
    return merged


def nominatim_geocode(city, attraction):
    """Get real lat/lng from Nominatim (via proxy)."""
    query = f"{city}{attraction}"
    try:
        resp = geo_session.get(
            'https://nominatim.openstreetmap.org/search',
            params={'q': query, 'format': 'json', 'limit': 1,
                    'countrycodes': 'cn'},
            headers={'User-Agent': 'TravelPhotoGuide/1.0'},
            timeout=15)
        data = resp.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"  Geocode error for {query}: {e}")
    return None, None


def step3_geocode(data):
    """Replace random coordinates with real ones."""
    success = 0
    fail = 0
    for entry in data:
        city = entry['cityName']
        attr = entry['attractionName']
        key = f"{city}:{attr}"
        if key in MANUAL_COORDS:
            lat, lng = MANUAL_COORDS[key]
            entry['latitude'] = lat
            entry['longitude'] = lng
            success += 1
            print(f"  OK: {city}/{attr} -> ({lat:.6f}, {lng:.6f}) (manual)")
            continue
        lat, lng = nominatim_geocode(city, attr)
        time.sleep(1.1)
        if lat and lng:
            entry['latitude'] = lat
            entry['longitude'] = lng
            success += 1
            print(f"  OK: {city}/{attr} -> ({lat:.6f}, {lng:.6f})")
        else:
            fail += 1
            print(f"  FAIL: {city}/{attr}")
    print(f"\n  Geocoded: {success} ok, {fail} failed")
    return data


def step4_validate(data):
    """Validate cleaned data quality."""
    issues = []
    for entry in data:
        name = entry['attractionName']
        if is_bad_name(name):
            issues.append(f"Still bad name: {entry['cityName']}/{name}")
        if not entry.get('latitude') or not entry.get('longitude'):
            issues.append(f"No coords: {entry['cityName']}/{name}")
        for s in entry.get('spots', []):
            if not s.get('images'):
                issues.append(f"No images: {name}/{s.get('name','?')[:20]}")
    return issues


def main():
    input_path = os.path.join(DATA_DIR, 'processed_data.json')
    output_path = os.path.join(DATA_DIR, 'cleaned_data.json')

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} entries\n")

    print("=== Step 1: Fix attraction names ===")
    data, name_map = step1_fix_names(data)

    print("\n=== Step 2: Merge duplicates ===")
    data = step2_merge_duplicates(data)

    print("\n=== Step 3: Geocode ===")
    data = step3_geocode(data)

    print("\n=== Step 4: Validate ===")
    issues = step4_validate(data)
    if issues:
        print(f"  {len(issues)} issues:")
        for i in issues[:15]:
            print(f"    - {i}")
    else:
        print("  All clean!")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    total_spots = sum(len(e.get('spots', [])) for e in data)
    total_imgs = sum(len(s.get('images', []))
                     for e in data for s in e.get('spots', []))
    print(f"\nSaved: {output_path}")
    print(f"Final: {len(data)} attractions, {total_spots} spots, {total_imgs} images")

    report = {"name_corrections": name_map, "final_count": len(data),
              "remaining_issues": issues}
    rp = os.path.join(DATA_DIR, 'clean_report.json')
    with open(rp, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
