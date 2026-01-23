#!/usr/bin/env python3
"""
互動式裁切工具
讓使用者手動檢視每一頁並指定題目位置
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

# 確保輸出目錄存在
DATA_DIR.mkdir(parents=True, exist_ok=True)


def show_image_info(image_path):
    """顯示圖片資訊"""
    img = Image.open(image_path)
    print(f"  圖片尺寸: {img.width} x {img.height} 像素")
    return img


def get_question_info_manually():
    """手動輸入題目資訊"""
    print("\n  請輸入這一頁的題目資訊（格式：題號,y起始,y結束）")
    print("  例如: 1,100,500")
    print("  多個題目用分號分隔，例如: 1,100,500;2,500,900;3,900,1300")
    print("  如果沒有題目（封面），直接按 Enter")

    user_input = input("  > ").strip()

    if not user_input:
        return []

    questions = []
    for item in user_input.split(';'):
        parts = item.strip().split(',')
        if len(parts) == 3:
            try:
                qnum = int(parts[0])
                y_start = int(parts[1])
                y_end = int(parts[2])
                questions.append({"number": qnum, "y_start": y_start, "y_end": y_end})
            except:
                print(f"  警告: 無法解析 '{item}'")

    return questions


def process_year_interactively(year):
    """互動式處理一個年份"""
    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return {}

    # 讀取所有圖片並排序
    files = sorted(
        [f for f in source_year_dir.iterdir() if f.suffix.lower() in ['.jpg', '.png', '.jpeg']],
        key=lambda x: int(re.search(r'\d+', x.stem).group())
    )

    print(f"\n{'='*60}")
    print(f"處理 {year} 年，共 {len(files)} 頁")
    print('='*60)

    all_questions = {}
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    for page_idx, image_path in enumerate(files):
        page_num = page_idx + 1

        print(f"\n第 {page_num} 頁: {image_path.name}")
        img = show_image_info(image_path)

        # 獲取題目資訊
        questions = get_question_info_manually()

        if not questions:
            print("  跳過此頁")
            continue

        # 裁切題目
        for q in questions:
            qnum = q['number']
            y_start = max(0, q['y_start'])
            y_end = min(img.height, q['y_end'])

            # 裁切
            cropped = img.crop((0, y_start, img.width, y_end))

            # 儲存
            output_path = year_dir / f"q{qnum:03d}.jpg"
            cropped.save(output_path, 'JPEG', quality=95)
            all_questions[qnum] = output_path

            print(f"  已裁切題目 {qnum}: {y_end - y_start}px")

    print(f"\n共裁切 {len(all_questions)} 題")

    # 生成 JSON
    generate_exam_json(year, all_questions)

    return all_questions


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

    print(f"已生成 JSON: {output_path}")


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("互動式試卷裁切工具")
    print("="*60)
    print("這個工具會逐頁顯示圖片資訊，您需要手動輸入題目位置")
    print("="*60)

    year = input("\n請輸入要處理的年份（例如：2020）: ").strip()

    if not year:
        print("未輸入年份，結束")
        sys.exit(0)

    process_year_interactively(year)

    # 複製 JSON 到 public
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)

    json_file = DATA_DIR / f"exam_{year}.json"
    if json_file.exists():
        shutil.copy(json_file, public_output / json_file.name)
        print(f"  已複製: {json_file.name}")

    print("\n處理完成！")


if __name__ == "__main__":
    main()
