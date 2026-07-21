import sys
import os
import json
import time
import random

sys.path.insert(0, '/home/zilky7/zhengyu/zilky7/tools/spider-xhs')

os.environ['ALL_PROXY'] = ''
os.environ['all_proxy'] = ''
os.environ['http_proxy'] = ''
os.environ['https_proxy'] = ''
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

from apis.xhs_pc_apis import XHS_Apis
from xhs_utils.common_util import load_env
from xhs_utils.data_util import handle_note_info
from loguru import logger

CITY_KEYWORDS = {
    "上海": ["上海拍照机位", "上海出片攻略"],
    "杭州": ["杭州拍照机位", "杭州出片攻略"],
    "成都": ["成都拍照机位", "成都出片攻略"],
    "北京": ["北京拍照机位", "北京出片攻略"],
    "厦门": ["厦门拍照机位", "厦门出片攻略"],
}

NOTES_PER_KEYWORD = 10
REQUEST_DELAY_MIN = 2.0
REQUEST_DELAY_MAX = 4.0
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')


def sleep_random():
    delay = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
    time.sleep(delay)


def download_image(url, filepath):
    import requests
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(resp.content)
        return True
    except Exception as e:
        logger.warning(f"download image failed: {e}")
        return False


def scrape_city(city, keywords, cookies_str, xhs_apis):
    city_dir = os.path.join(DATA_DIR, city)
    os.makedirs(city_dir, exist_ok=True)

    all_notes = []
    seen_ids = set()

    for keyword in keywords:
        logger.info(f"[{city}] searching: {keyword}")
        try:
            success, msg, notes = xhs_apis.search_some_note(
                keyword, NOTES_PER_KEYWORD, cookies_str,
                sort_type_choice=2, note_type=2
            )
            if not success:
                logger.error(f"[{city}] search failed: {msg}")
                continue

            notes = [n for n in notes if n.get('model_type') == 'note']
            logger.info(f"[{city}] found {len(notes)} notes for '{keyword}'")

            for note in notes:
                note_id = note.get('id', '')
                if note_id in seen_ids:
                    continue
                seen_ids.add(note_id)

                xsec_token = note.get('xsec_token', '')
                note_url = (
                    f"https://www.xiaohongshu.com/explore/{note_id}"
                    f"?xsec_token={xsec_token}&xsec_source=pc_search"
                )

                sleep_random()

                s, m, detail = xhs_apis.get_note_info(note_url, cookies_str)
                if not s:
                    logger.warning(f"[{city}] get note detail failed: {m}")
                    continue

                try:
                    item = detail['data']['items'][0]
                    item['url'] = note_url
                    info = handle_note_info(item)
                    info['search_city'] = city
                    info['search_keyword'] = keyword
                except Exception as e:
                    logger.warning(f"[{city}] parse note failed: {e}")
                    continue

                note_dir = os.path.join(city_dir, note_id)
                os.makedirs(note_dir, exist_ok=True)

                with open(os.path.join(note_dir, 'info.json'), 'w', encoding='utf-8') as f:
                    json.dump(info, f, ensure_ascii=False, indent=2)

                for idx, img_url in enumerate(info.get('image_list', [])):
                    img_path = os.path.join(note_dir, f'image_{idx}.jpg')
                    if not os.path.exists(img_path):
                        download_image(img_url, img_path)

                all_notes.append(info)
                logger.info(
                    f"[{city}] [{len(all_notes)}] {info['title'][:30]}  "
                    f"likes={info['liked_count']}"
                )

        except Exception as e:
            logger.error(f"[{city}] keyword '{keyword}' error: {e}")

        sleep_random()

    summary_path = os.path.join(city_dir, 'summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(all_notes, f, ensure_ascii=False, indent=2)

    logger.info(f"[{city}] total: {len(all_notes)} notes saved")
    return all_notes


def main():
    os.environ.pop('ALL_PROXY', None)
    os.environ.pop('all_proxy', None)

    spider_env = os.path.join(
        os.path.dirname(__file__), '..', '..', '..', 'Spider_XHS', '.env'
    )
    from dotenv import load_dotenv
    load_dotenv(spider_env)
    cookies_str = os.getenv('COOKIES', '')
    if not cookies_str:
        logger.error("COOKIES not found in Spider_XHS/.env")
        return

    xhs_apis = XHS_Apis()
    os.makedirs(DATA_DIR, exist_ok=True)

    total = 0
    for city, keywords in CITY_KEYWORDS.items():
        notes = scrape_city(city, keywords, cookies_str, xhs_apis)
        total += len(notes)
        sleep_random()

    logger.info(f"=== ALL DONE: {total} notes across {len(CITY_KEYWORDS)} cities ===")


if __name__ == '__main__':
    main()
