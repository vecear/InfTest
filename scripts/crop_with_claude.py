#!/usr/bin/env python3
"""
使用 Claude Vision API 辨識題目並裁切
更準確的方法：讓 Claude 分析圖片並告訴我們題目的位置
"""

import os
import sys
import json
import base64
from pathlib import Path
from PIL import Image
import anthropic

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
SOURCE_DIR = BASE_DIR / "his" / "image"
OUTPUT_DIR = BASE_DIR / "public" / "images" / "exams"
DATA_DIR = BASE_DIR / "scripts" / "output"

# 確保輸出目錄存在
DATA_DIR.mkdir(parents=True, exist_ok=True)


def encode_image_to_base64(image_path):
    """將圖片編碼為 base64"""
    with open(image_path, "rb") as image_file:
        return base64.standard_b64encode(image_file.read()).decode("utf-8")


def get_image_media_type(image_path):
    """獲取圖片的 MIME type"""
    suffix = image_path.suffix.lower()
    if suffix == '.png':
        return 'image/png'
    elif suffix in ['.jpg', '.jpeg']:
        return 'image/jpeg'
    elif suffix == '.webp':
        return 'image/webp'
    elif suffix == '.gif':
        return 'image/gif'
    else:
        return 'image/jpeg'


def analyze_page_with_claude(image_path, api_key):
    """使用 Claude 分析頁面中的題目"""
    print(f"  使用 Claude 分析 {image_path.name}...")

    client = anthropic.Anthropic(api_key=api_key)

    # 編碼圖片
    image_data = encode_image_to_base64(image_path)
    media_type = get_image_media_type(image_path)

    # 讀取圖片尺寸
    img = Image.open(image_path)
    width, height = img.size

    # 建立提示
    prompt = f"""請仔細分析這張試卷圖片（尺寸：{width}x{height}像素）。

這是一份醫學考試試卷的頁面。請幫我找出這一頁中所有題目的位置。

要求：
1. 辨識出每個題目的題號（例如：1., 2., 3. 或 26., 27., 28. 等）
2. 對於每個題目，提供其在圖片中的垂直位置範圍（Y座標的起始和結束位置）
3. 題目的起始位置應該包含題號，結束位置應該是下一題開始之前

請以 JSON 格式回應，格式如下：
{{
  "questions": [
    {{"number": 1, "y_start": 100, "y_end": 400}},
    {{"number": 2, "y_start": 400, "y_end": 700}},
    ...
  ]
}}

注意：
- Y座標的範圍是 0 到 {height}
- 確保每個題目的 y_end 等於或略小於下一題的 y_start
- 如果這是封面頁或沒有題目，返回空的 questions 陣列
- 只返回 JSON，不要有其他文字"""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        # 解析回應
        response_text = message.content[0].text

        # 移除可能的 markdown 代碼塊標記
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)

        print(f"  Claude 找到 {len(result['questions'])} 個題目")
        return result['questions']

    except Exception as e:
        print(f"  錯誤: {e}")
        return []


def crop_questions_from_analysis(image_path, questions, year):
    """根據 Claude 的分析結果裁切題目"""
    if not questions:
        return []

    # 建立輸出目錄
    year_dir = OUTPUT_DIR / year / "questions"
    year_dir.mkdir(parents=True, exist_ok=True)

    # 開啟圖片
    img = Image.open(image_path)

    cropped_images = []

    for q in questions:
        qnum = q['number']
        y_start = max(0, q['y_start'] - 10)  # 加上一點邊距
        y_end = min(img.height, q['y_end'] + 10)

        # 裁切
        cropped = img.crop((0, y_start, img.width, y_end))

        # 儲存
        output_path = year_dir / f"q{qnum:03d}.jpg"
        cropped.save(output_path, 'JPEG', quality=95)
        cropped_images.append((qnum, output_path))

        print(f"  題目 {qnum}: {y_end - y_start}px")

    return cropped_images


def process_year_with_claude(year, api_key):
    """使用 Claude 處理一個年份"""
    source_year_dir = SOURCE_DIR / year

    if not source_year_dir.exists():
        print(f"錯誤: 找不到目錄 {source_year_dir}")
        return []

    # 讀取所有圖片並排序
    import re
    files = sorted(
        [f for f in source_year_dir.iterdir() if f.suffix.lower() in ['.jpg', '.png', '.jpeg']],
        key=lambda x: int(re.search(r'\d+', x.stem).group())
    )

    print(f"\n{'='*60}")
    print(f"處理 {year} 年，共 {len(files)} 頁")
    print('='*60)

    all_questions = {}

    for page_idx, image_path in enumerate(files):
        page_num = page_idx + 1

        # 跳過封面
        if page_num == 1:
            print(f"\n第 {page_num} 頁: 封面，跳過")
            continue

        print(f"\n第 {page_num} 頁:")

        try:
            # 使用 Claude 分析
            questions = analyze_page_with_claude(image_path, api_key)

            if not questions:
                print("  未找到題目，跳過")
                continue

            # 裁切題目
            cropped = crop_questions_from_analysis(image_path, questions, year)

            for qnum, path in cropped:
                all_questions[qnum] = path

        except Exception as e:
            print(f"  錯誤: {e}")
            import traceback
            traceback.print_exc()
            continue

    print(f"\n{'='*60}")
    print(f"完成！{year} 年共裁切 {len(all_questions)} 題")
    print('='*60)

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

    print("使用 Claude Vision API 裁切試卷題目")
    print("="*60)

    # 讀取 API Key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("錯誤: 請設定 ANTHROPIC_API_KEY 環境變數")
        print("例如: export ANTHROPIC_API_KEY=your-api-key")
        sys.exit(1)

    print(f"API Key: {api_key[:20]}...")

    # 先處理一個年份測試
    years = ['2020']

    for year in years:
        try:
            process_year_with_claude(year, api_key)
        except Exception as e:
            print(f"\nERROR - {year}: {e}")
            import traceback
            traceback.print_exc()

    # 複製 JSON 到 public
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)

    for json_file in DATA_DIR.glob("exam_*.json"):
        shutil.copy(json_file, public_output / json_file.name)
        print(f"  已複製: {json_file.name}")

    print("\n" + "="*60)
    print("處理完成！")
    print("="*60)
    print("\n下一步:")
    print("1. 檢查裁切結果")
    print("2. 如果滿意，修改 main() 中的 years 列表處理所有年份")
    print("3. 使用網頁介面匯入")


if __name__ == "__main__":
    main()
