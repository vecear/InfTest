#!/usr/bin/env python3
"""
使用 Claude API 從2023年文字檔案中提取題目和詳解
支援 PDF 檔案,直接請 Claude 分析並結構化內容
"""

import os
import sys
import json
import base64
from pathlib import Path

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
TEXT_DIR = BASE_DIR / "public" / "text" / "2023"
OUTPUT_DIR = BASE_DIR / "scripts" / "output"

# 確保輸出目錄存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def encode_pdf_to_base64(pdf_path):
    """將PDF編碼為base64"""
    with open(pdf_path, 'rb') as f:
        return base64.standard_b64encode(f.read()).decode('utf-8')


def extract_questions_with_claude(file_path, start_q, end_q):
    """使用Claude API提取題目"""
    try:
        import anthropic
    except ImportError:
        print("需要安裝 anthropic SDK: pip install anthropic")
        return []

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("錯誤: 請設定 ANTHROPIC_API_KEY 環境變數")
        return []

    print(f"\n使用 Claude 分析: {file_path.name} (題號 {start_q}-{end_q})")

    client = anthropic.Anthropic(api_key=api_key)

    # 編碼PDF
    pdf_data = encode_pdf_to_base64(file_path)

    prompt = f"""請仔細分析這份PDF文件,提取第 {start_q} 到 {end_q} 題的完整內容。

每一題的格式通常是:
- 題號和題目內容
- 可能有數字編號的子項目 (1. 2. 3. 等)
- 選項 A-E (可能是組合,如 "1+3", "1+2+3" 等)
- 答案 (格式: "答案：X" 或 "答案: X")
- 詳解 (答案之後的所有說明)

請以JSON格式返回,格式如下:
{{
  "questions": [
    {{
      "number": 38,
      "content": "完整的題目內容,包含所有子項目",
      "options": [
        {{"text": "A", "label": "1+3"}},
        {{"text": "B", "label": "1+4"}},
        {{"text": "C", "label": "1+5"}},
        {{"text": "D", "label": "1+2+3+4"}},
        {{"text": "E", "label": "1+2+3+4+5"}}
      ],
      "correctAnswer": "C",
      "answerExplanation": "完整的答案詳解內容"
    }}
  ]
}}

重要:
1. content 要包含題目本身和所有編號子項目的完整文字
2. options 的 label 就是選項顯示的內容 (如 "1+3")
3. correctAnswer 只要字母 (A/B/C/D/E)
4. answerExplanation 包含答案後的所有詳細說明
5. 只返回JSON,不要有其他文字"""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=16000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_data
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )

        # 解析回應
        response_text = message.content[0].text.strip()

        # 移除可能的 markdown 代碼塊標記
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)
        questions = result.get('questions', [])

        print(f"  成功提取 {len(questions)} 題")
        for q in questions:
            print(f"    ✓ 題目 {q['number']}")

        return questions

    except Exception as e:
        print(f"  錯誤: {e}")
        import traceback
        traceback.print_exc()
        return []


def process_pdf_files():
    """處理所有PDF檔案"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("2023年試題提取工具 (使用 Claude API)")
    print("=" * 60)

    # 檢查 API Key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n錯誤: 請設定 ANTHROPIC_API_KEY 環境變數")
        print("例如: set ANTHROPIC_API_KEY=your-api-key")
        sys.exit(1)

    # 安裝必要套件
    print("\n檢查必要套件...")
    try:
        import anthropic
        print("✓ anthropic SDK 已安裝")
    except ImportError:
        print("安裝 anthropic SDK...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "anthropic"])

    # 讀取PDF檔案
    pdf_files = sorted(TEXT_DIR.glob("*.pdf"))

    print(f"\n找到 {len(pdf_files)} 個 PDF 檔案")

    all_questions = []

    for pdf_file in pdf_files:
        # 從檔名提取題號範圍
        import re
        match = re.match(r"(\d+)-(\d+)", pdf_file.stem)
        if not match:
            print(f"  警告: 無法從檔名 {pdf_file.stem} 解析題號範圍")
            continue

        start_q = int(match.group(1))
        end_q = int(match.group(2))

        questions = extract_questions_with_claude(pdf_file, start_q, end_q)
        all_questions.extend(questions)

    # 按題號排序
    all_questions.sort(key=lambda x: x['number'])

    print(f"\n共提取 {len(all_questions)} 題")

    # 生成試卷 JSON
    exam_data = {
        "title": "2023年感染症專科醫師甄審筆試",
        "year": 2023,
        "category": "WRITTEN",
        "questions": []
    }

    for idx, q in enumerate(all_questions):
        # 轉換選項格式
        options = []
        for opt in q.get('options', []):
            options.append({
                "text": opt.get('text', ''),
                "label": opt.get('label', ''),
                "order": ord(opt.get('text', 'A')) - ord('A')
            })

        question = {
            "order": idx,
            "content": q.get('content', ''),
            "type": "CHOICE",
            "imageUrl": "",
            "imageUrls": [],
            "options": options,
            "correctAnswer": q.get('correctAnswer', ''),
            "answerExplanation": q.get('answerExplanation', '')
        }
        exam_data["questions"].append(question)

    # 儲存 JSON
    output_path = OUTPUT_DIR / "exam_2023_claude.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 已生成 JSON: {output_path}")

    # 複製到 public 目錄
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)
    shutil.copy(output_path, public_output / "exam_2023.json")
    print(f"  已複製為: exam_2023.json")

    print("\n" + "=" * 60)
    print("處理完成！")
    print("=" * 60)
    print("\n下一步:")
    print("1. 檢查生成的 JSON: scripts/output/exam_2023_claude.json")
    print("2. 使用網頁介面匯入試卷: http://localhost:3000/admin/import")


if __name__ == "__main__":
    process_pdf_files()
