import os
import re
import json
import time
import random
import requests
from loguru import logger
from collections import defaultdict

os.environ['ALL_PROXY'] = ''
os.environ['all_proxy'] = ''
os.environ['http_proxy'] = ''
os.environ['https_proxy'] = ''

DEEPSEEK_KEY = "sk-074e742a1e004208aa55673316c0b0e5"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"

MIMO_KEY = "tp-clptelp2lcvqtu94qn9vg1qn3ricn6ct1do7tqyvgxgyf0ik"
MIMO_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions"
MIMO_MODEL = "mimo-v2.5-pro"

KNOWN_CITIES = ["成都", "大理", "上海", "北京", "南京", "杭州", "重庆", "西安", "厦门", "丽江"]

KNOWN_ATTRACTIONS = [
    "外滩", "陆家嘴", "武康大楼", "南京路", "迪士尼", "豫园", "淮海路", "苏州河",
    "西湖", "灵隐寺", "青山湖", "千岛湖",
    "宽窄巷子", "武侯祠", "锦里", "春熙路", "太古里", "天府广场", "交子之环", "文殊院",
    "故宫", "天坛", "颐和园", "长城", "天安门", "南锣鼓巷",
    "鼓浪屿", "曾厝垵", "环岛路", "南普陀寺", "厦门大学",
    "洱海", "苍山", "大理古城", "双廊",
    "丽江古城", "玉龙雪山",
    "解放碑", "洪崖洞", "磁器口",
    "大雁塔", "钟楼", "回民街",
    "夫子庙", "中山陵", "玄武湖", "明孝陵",
]

CITY_CENTER = {
    "成都": (30.5728, 104.0668), "大理": (25.6065, 100.2676),
    "上海": (31.2304, 121.4737), "北京": (39.9042, 116.4074),
    "南京": (32.0603, 118.7969), "杭州": (30.2741, 120.1551),
    "重庆": (29.5630, 106.5516), "西安": (34.3416, 108.9398),
    "厦门": (24.4798, 118.0894), "丽江": (26.8721, 100.2299),
}

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


def match_city(info):
    city = info.get('search_city', '')
    if city in KNOWN_CITIES:
        return city
    text = ' '.join(info.get('tags', [])) + ' ' + info.get('desc', '') + ' ' + info.get('title', '')
    for c in KNOWN_CITIES:
        if c in text:
            return c
    return city if city else None


def extract_attraction(info):
    desc = info.get('desc', '')
    title = info.get('title', '')
    tags = info.get('tags', [])
    all_text = title + ' ' + desc + ' ' + ' '.join(tags)

    for kw in KNOWN_ATTRACTIONS:
        if kw in all_text:
            return kw

    patterns = [
        r'[📍]\s*[：:]*\s*(.{2,15})',
        r'(?:拍摄地[点]?|地[点址]|位置|打卡地)[：:]\s*(.{2,15})',
    ]
    for p in patterns:
        m = re.search(p, desc)
        if m:
            spot = m.group(1).strip().rstrip('，。,.')
            if len(spot) >= 2:
                return spot

    return None


def extract_attractions_ai(info):
    """Use MiMo API to extract ALL attractions from a note. Returns list of attraction names."""
    desc = info.get('desc', '')[:500]
    title = info.get('title', '')
    tags = ','.join(info.get('tags', [])[:8])
    prompt = (
        f"title: {title}\ndesc: {desc}\ntags: {tags}\n\n"
        "This is a Xiaohongshu travel note. Extract ALL tourist attraction/location names mentioned. "
        "If the note recommends multiple places (e.g. lists like P1:xxx P2:xxx, or numbered spots), "
        "list each one separately. Only include real place names, not generic descriptions. "
        "Return JSON array: [\"attraction1\", \"attraction2\", ...]"
    )
    try:
        resp = requests.post(MIMO_URL, json={
            "model": MIMO_MODEL,
            "messages": [
                {"role": "system", "content": "Extract tourist attraction names from travel content. Return JSON array only."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500, "temperature": 0.2
        }, headers={"Authorization": f"Bearer {MIMO_KEY}"}, timeout=30)
        data = resp.json()
        choice = data['choices'][0]['message']
        text = choice.get('content', '') or ''
        if not text and choice.get('reasoning_content'):
            text = '[]'
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        result = json.loads(text)
        if isinstance(result, list) and len(result) > 0:
            return [a for a in result if isinstance(a, str) and 2 <= len(a) <= 20]
        return []
    except Exception as e:
        logger.warning(f"MiMo extract failed: {e}")
        return []


def parse_liked(val):
    s = str(val)
    if '万' in s:
        num = float(re.sub(r'[^\d.]', '', s))
        return int(num * 10000)
    return int(re.sub(r'[^\d]', '', s) or '0')


def extract_tips(desc):
    tips = {"compositionTips": "", "outfitTips": "", "photoTips": ""}
    comp_m = re.search(r'(?:构图|机位|角度)[：:]\s*(.{5,100})', desc)
    if comp_m:
        tips["compositionTips"] = comp_m.group(1).strip()
    outfit_m = re.search(r'(?:穿搭|服装|衣服)[：:]\s*(.{5,100})', desc)
    if outfit_m:
        tips["outfitTips"] = outfit_m.group(1).strip()
    photo_m = re.search(r'(?:拍摄|拍照|摄影)[：:]\s*(.{5,80})', desc)
    if photo_m:
        tips["photoTips"] = photo_m.group(1).strip()
    return tips


def split_note_into_spots_ai(info):
    """Use AI to split a multi-spot note into individual spot descriptions with image mapping."""
    desc = info.get('desc', '')
    title = info.get('title', '')
    image_count = len(info.get('image_list', []))
    if len(desc) < 80:
        return None

    has_multi_markers = bool(re.search(r'[Pp]\d|图[1-9]|[1-9][️⃣]|[①②③④⑤]', desc))
    if not has_multi_markers:
        return None

    prompt = (
        f"title: {title}\n"
        f"total images: {image_count} (numbered image_0 to image_{image_count-1})\n"
        f"desc:\n{desc[:800]}\n\n"
        "This XHS note describes multiple photography spots. "
        "The note has P1/P2/... or numbered markers that correspond to images in order. "
        "For example, P1 or figure 1 usually corresponds to image_0, P2 to image_1, etc.\n"
        "Split into individual spots and map each to its image numbers.\n"
        "Return JSON array:\n"
        "[{\"name\":\"spot name\",\"description\":\"what to shoot\","
        "\"photoTips\":\"shooting advice\",\"outfitTips\":\"clothing tips\","
        "\"imageIndices\":[0,1]}]\n"
        "imageIndices: array of 0-based image indices that belong to this spot.\n"
        "Only include spots with clear names. Skip generic text."
    )
    try:
        resp = requests.post(MIMO_URL, json={
            "model": MIMO_MODEL,
            "messages": [
                {"role": "system", "content": "Extract photography spots with image mapping. Return JSON array only."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2000, "temperature": 0.2
        }, headers={"Authorization": f"Bearer {MIMO_KEY}"}, timeout=60)
        data = resp.json()
        choice = data['choices'][0]['message']
        text = choice.get('content', '') or ''
        if not text:
            return None
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        result = json.loads(text)
        if isinstance(result, list) and len(result) >= 2:
            valid = [s for s in result if isinstance(s, dict) and s.get('name') and len(s['name']) >= 2]
            if len(valid) >= 2:
                return valid
        return None
    except Exception as e:
        logger.warning(f"AI spot split failed: {e}")
        return None


def make_spot_name(info, attraction_name):
    title = info.get('title', '')
    clean = re.sub(r'[📷📸🔥💯❗️|｜‼]+', '', title).strip()
    if clean and clean != attraction_name and len(clean) <= 40:
        return clean
    return f"{attraction_name} - {info.get('nickname', 'unknown')[:10]}的机位"


def main():
    groups = defaultdict(lambda: {"notes": [], "city": ""})

    city_dirs = [d for d in os.listdir(DATA_DIR)
                 if os.path.isdir(os.path.join(DATA_DIR, d)) and d != '__pycache__']

    for city_dir_name in sorted(city_dirs):
        city_path = os.path.join(DATA_DIR, city_dir_name)
        note_dirs = [d for d in os.listdir(city_path)
                     if os.path.isdir(os.path.join(city_path, d))]

        logger.info(f"Processing city dir: {city_dir_name} ({len(note_dirs)} notes)")

        for note_dir_name in note_dirs:
            note_dir = os.path.join(city_path, note_dir_name)
            info_path = os.path.join(note_dir, 'info.json')
            if not os.path.exists(info_path):
                continue

            with open(info_path, 'r', encoding='utf-8') as f:
                info = json.load(f)

            city = match_city(info)
            if not city:
                continue

            rule_attraction = extract_attraction(info)

            desc = info.get('desc', '')
            looks_multi = bool(re.search(r'[P📍]\d|[1-9][️⃣]|图[1-9]', desc))

            if looks_multi or not rule_attraction:
                ai_attractions = extract_attractions_ai(info)
                time.sleep(1)
                if ai_attractions and len(ai_attractions) >= 1:
                    for attr_name in ai_attractions:
                        key = f"{city}:{attr_name}"
                        groups[key]["city"] = city
                        groups[key]["notes"].append((info, note_dir))
                    continue

            attraction = rule_attraction or info.get('title', 'unknown')[:20]
            key = f"{city}:{attraction}"
            groups[key]["city"] = city
            groups[key]["notes"].append((info, note_dir))

    results = []
    for key, group in sorted(groups.items()):
        city = group["city"]
        attraction_name = key.split(":", 1)[1]
        notes = group["notes"]

        best_note = max(notes, key=lambda x: parse_liked(x[0].get('liked_count', 0)))
        best_info = best_note[0]

        center = CITY_CENTER.get(city, (39.9, 116.4))
        lat = center[0] + random.uniform(-0.02, 0.02)
        lng = center[1] + random.uniform(-0.02, 0.02)

        hot_score = sum(parse_liked(n[0].get('liked_count', 0)) for n in notes)

        spots = []
        for info, note_dir in notes:
            images = sorted([f for f in os.listdir(note_dir) if f.endswith('.jpg')]) if os.path.isdir(note_dir) else []

            ai_spots = split_note_into_spots_ai(info)
            time.sleep(1)

            if ai_spots:
                for si, sp in enumerate(ai_spots):
                    indices = sp.get("imageIndices", [])
                    if indices and images:
                        spot_images = [images[i] for i in indices if i < len(images)]
                    else:
                        img_per = max(1, len(images) // len(ai_spots))
                        spot_images = images[si * img_per:(si + 1) * img_per]
                    if not spot_images and images:
                        spot_images = [images[min(si, len(images) - 1)]]
                    spots.append({
                        "name": sp.get("name", f"机位{si+1}"),
                        "description": sp.get("description", ""),
                        "images": spot_images,
                        "compositionTips": sp.get("photoTips", ""),
                        "outfitTips": sp.get("outfitTips", ""),
                        "photoTips": sp.get("photoTips", ""),
                        "likedCount": str(info.get('liked_count', '')),
                        "sourceUrl": info.get('note_url', ''),
                        "localDir": note_dir,
                    })
                logger.info(f"    AI split: {info.get('title','')[:25]} -> {len(ai_spots)} spots (with image mapping)")
            else:
                tips = extract_tips(info.get('desc', ''))
                spots.append({
                    "name": make_spot_name(info, attraction_name),
                    "description": info.get('desc', ''),
                    "images": images,
                    "compositionTips": tips["compositionTips"],
                    "outfitTips": tips["outfitTips"],
                    "photoTips": tips["photoTips"],
                    "likedCount": str(info.get('liked_count', '')),
                    "sourceUrl": info.get('note_url', ''),
                    "localDir": note_dir,
                })

        results.append({
            "cityName": city,
            "attractionName": attraction_name,
            "description": best_info.get('desc', '')[:300],
            "coverImage": "",
            "latitude": lat,
            "longitude": lng,
            "hotScore": hot_score,
            "spots": spots,
        })

    results.sort(key=lambda x: -x["hotScore"])

    output_path = os.path.join(DATA_DIR, 'processed_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    logger.info(f"Done: {len(results)} attractions, {sum(len(a['spots']) for a in results)} spots")
    for r in results[:10]:
        logger.info(f"  {r['cityName']}/{r['attractionName']}: {len(r['spots'])} spots, hot={r['hotScore']}")


if __name__ == '__main__':
    main()
