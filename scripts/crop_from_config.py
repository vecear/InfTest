#!/usr/bin/env python3
"""
根據配置檔裁切試卷題目
使用 Claude 分析生成的配置檔進行精確裁切
"""

import os
import sys
import json
import re
from pathlib import Path
from PIL import Image

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
SOURCE_DIR = BASE_DIR / "his" / "image"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"
DATA_DIR = BASE_DIR / "scripts" / "output"
CONFIG_DIR = BASE_DIR / "scripts"

# 確保輸出目錄存在
DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_config(year):
    """載入配置檔"""
    config_path = CONFIG_DIR / f"crop_config_{year}.json"

    if not config_path.exists():
        print(f"錯誤: 找不到配置檔 {config_path}")
        return None

    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def merge_question_parts(pages_config):
    """合併跨頁的題目部分"""
    # 建立題號到所有出現位置的映射
    question_parts = {}

    for page_config in pages_config:
        page_num = page_config['page']

        if 'skip' in page_config and page_config['skip']:
            continue

        for q in page_config.get('questions', []):
            qnum = q['number']

            if qnum not in question_parts:
                question_parts[qnum] = []

            question_parts[qnum].append({
                'page': page_num,
                'y_start': q['y_start'],
                'y_end': q['y_end']
            })

    # 合併每個題目的所有部分
    merged_questions = {}

    for qnum, parts in question_parts.items():
        # 按頁碼排序
        parts.sort(key=lambda x: x['page'])

        # 如果題目只在一頁，直接使用
        if len(parts) == 1:
            merged_questions[qnum] = parts[0]
        else:
            # 題目跨頁，需要合併
            # 使用第一個出現的頁面，並取最大的 y_end
            first_part = parts[0]
            last_part = parts[-1]

            # 如果第一部分的 y_end 接近頁面底部，使用第一頁
            # 否則使用最後一頁（題目主要內容在那裡）
            if first_part['y_end'] > 1500:  # 接近頁面底部
                merged_questions[qnum] = first_part
            else:
                merged_questions[qnum] = last_part

    return merged_questions


def crop_from_config(year, config):
    """根據配置檔裁切圖片"""
    print(f"\n{'='*60}")
    print(f"處理 {year} 年")
    print('='*60)

    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return {}

    # 合併跨頁題目
    merged_questions = merge_question_parts(config['pages'])

    print(f"共找到 {len(merged_questions)} 個題目")

    # 建立輸出目錄
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    # 裁切每個題目
    cropped_images = {}

    for qnum in sorted(merged_questions.keys()):
        part = merged_questions[qnum]
        page_num = part['page']
        y_start = part['y_start']
        y_end = part['y_end']

        # 找到對應的圖片檔案 (支援多種命名格式)
        image_files = list(source_year_dir.glob(f"*_Page{page_num}.*"))

        # 如果找不到 *_Page 格式，嘗試簡單數字格式
        if not image_files:
            image_files = list(source_year_dir.glob(f"{page_num}.*"))

        # 如果還是找不到，嘗試 {page_num}-1.* 格式
        if not image_files:
            image_files = list(source_year_dir.glob(f"{page_num}-1.*"))

        if not image_files:
            print(f"  警告: 找不到第 {page_num} 頁的圖片")
            continue

        image_path = image_files[0]

        # 開啟並裁切
        img = Image.open(image_path)

        # 確保座標在範圍內
        y_start = max(0, y_start)
        y_end = min(img.height, y_end)

        # 裁切
        cropped = img.crop((0, y_start, img.width, y_end))

        # 儲存
        output_path = year_dir / f"q{qnum:03d}.jpg"
        cropped.save(output_path, 'JPEG', quality=95)
        cropped_images[qnum] = output_path

        if qnum % 10 == 0:
            print(f"  已裁切 {qnum}/100 題")

    print(f"✓ 完成！共裁切 {len(cropped_images)} 題")

    # 生成 JSON
    generate_exam_json(year, cropped_images)

    return cropped_images


def generate_exam_json(year, questions_dict):
    """生成試卷 JSON 檔案"""
    exam_data = {
        "title": f"{year}年感染症專科醫師甄審筆試",
        "year": int(year),
        "category": "WRITTEN",
        "questions": []
    }

    # 按題號排序
    sorted_questions = sorted(questions_dict.items(), key=lambda x: x[0])

    for idx, (qnum, img_path) in enumerate(sorted_questions):
        rel_path = img_path.relative_to(BASE_DIR / "public")
        url_path = "/" + str(rel_path).replace("\\", "/")

        question = {
            "order": idx,
            "content": f"第 {qnum} 題",
            "type": "CHOICE",
            "imageUrl": url_path,
            "imageUrls": [url_path],
            "options": [
                {"text": "A", "order": 0},
                {"text": "B", "order": 1},
                {"text": "C", "order": 2},
                {"text": "D", "order": 3},
                {"text": "E", "order": 4}
            ],
            "correctAnswer": "",
            "answerExplanation": ""
        }
        exam_data["questions"].append(question)

    # 儲存 JSON
    output_path = DATA_DIR / f"exam_{year}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"✓ 已生成 JSON: {output_path}")


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("基於配置檔的試卷裁切工具")
    print("="*60)

    year = "2020"

    # 載入配置
    config = load_config(year)

    if not config:
        sys.exit(1)

    # 裁切
    crop_from_config(year, config)

    # 複製 JSON 到 public
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)

    json_file = DATA_DIR / f"exam_{year}.json"
    if json_file.exists():
        shutil.copy(json_file, public_output / json_file.name)
        print(f"  已複製: {json_file.name}")

    print("\n" + "="*60)
    print("處理完成！")
    print("="*60)
    print("\n下一步:")
    print("1. 檢查裁切結果: public/images/exams/2020/questions/")
    print("2. 如果滿意，為其他年份建立配置檔並處理")
    print("3. 使用網頁介面匯入試卷")


if __name__ == "__main__":
    main()
