#!/usr/bin/env python3
"""
改進版題目提取工具
支援更複雜的題目格式
"""

import os
import sys
import json
import re
from pathlib import Path

# 設定路徑
BASE_DIR = Path(__file__).parent.parent
TEXT_DIR = BASE_DIR / "public" / "text" / "2023"
OUTPUT_DIR = BASE_DIR / "scripts" / "output"

# 確保輸出目錄存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def extract_from_pdf(pdf_path):
    """從PDF提取文字內容"""
    try:
        import PyPDF2

        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"  錯誤: {e}")
        return None


def extract_from_docx(docx_path):
    """從Word文檔提取文字內容"""
    try:
        from docx import Document

        doc = Document(docx_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"  錯誤: {e}")
        return None


def parse_questions_improved(text, start_num, end_num):
    """改進的題目解析邏輯"""
    questions = []

    for qnum in range(start_num, end_num + 1):
        # 更靈活的題目匹配模式
        # 匹配 "38." 或 "38、" 或 "38 " 開頭
        patterns = [
            rf"{qnum}\.\s+(.*?)(?=\n(?:{qnum+1}[\.\s、]|答案[：:]|解[：:]|\Z))",
            rf"{qnum}、\s+(.*?)(?=\n(?:{qnum+1}[\.\s、]|答案[：:]|解[：:]|\Z))",
            rf"{qnum}\s+(.*?)(?=\n(?:{qnum+1}[\.\s、]|答案[：:]|解[：:]|\Z))",
        ]

        question_text = None
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                question_text = match.group(1).strip()
                break

        if not question_text:
            continue

        # 提取選項 - 支援多種格式
        options = []

        # 先找到題目結束位置
        option_text = question_text

        # 方法1: 匹配 A. B. C. D. E. 格式
        option_matches = list(re.finditer(r'\n([ABCDE])\.\s*([^\n]+)', option_text))

        if len(option_matches) >= 4:  # 至少有4個選項
            for match in option_matches:
                letter = match.group(1)
                content = match.group(2).strip()
                options.append({
                    "text": letter,
                    "label": content,
                    "order": ord(letter) - ord('A')
                })
        else:
            # 方法2: 匹配組合格式如 "A. 1+3"
            combo_matches = list(re.finditer(r'\n([ABCDE])\.\s*([0-9+]+)', option_text))
            if len(combo_matches) >= 4:
                for match in combo_matches:
                    letter = match.group(1)
                    content = match.group(2).strip()
                    options.append({
                        "text": letter,
                        "label": content,
                        "order": ord(letter) - ord('A')
                    })

        # 如果還是沒有選項,創建默認的A-E
        if len(options) == 0:
            for i, letter in enumerate(['A', 'B', 'C', 'D', 'E']):
                options.append({
                    "text": letter,
                    "label": letter,
                    "order": i
                })

        # 移除選項部分,保留純題目內容
        if option_matches:
            first_option_pos = option_matches[0].start()
            pure_question = question_text[:first_option_pos].strip()
        else:
            pure_question = question_text

        # 提取答案 - 多種格式
        answer = ""
        answer_patterns = [
            rf"(?:答案|解)[：:]\s*\(?([ABCDE])\)?",
            rf"\n([ABCDE])\.",  # 如果直接是選項
        ]

        # 在整個文本中搜索答案
        search_start = text.find(str(qnum) + ".")
        search_end = text.find(str(qnum + 1) + ".", search_start + 1) if qnum < end_num else len(text)
        search_text = text[search_start:search_end] if search_start != -1 else text

        for ans_pattern in answer_patterns:
            ans_match = re.search(ans_pattern, search_text)
            if ans_match:
                answer = ans_match.group(1)
                break

        # 提取詳解
        explanation = ""
        exp_patterns = [
            rf"(?:答案|解)[：:]\s*\(?[ABCDE]\)?\s*[。．]?\s*(.*?)(?=\n\n|\n{qnum+1}[\.\s、]|\Z)",
            rf"(?:答案|解)[：:]\s*\(?[ABCDE]\)?\s*(.*?)(?=\n\n|\n{qnum+1}[\.\s、]|\Z)",
        ]

        for exp_pattern in exp_patterns:
            exp_match = re.search(exp_pattern, search_text, re.DOTALL)
            if exp_match:
                explanation = exp_match.group(1).strip()
                # 清理開頭的標點
                explanation = re.sub(r'^[。．\s]+', '', explanation)
                if len(explanation) > 10:  # 確保不是空的或太短
                    break

        question = {
            "number": qnum,
            "content": pure_question,
            "options": options,
            "correctAnswer": answer,
            "answerExplanation": explanation
        }

        questions.append(question)
        print(f"  ✓ 題目 {qnum}: {len(pure_question)} 字, {len(options)} 選項, 答案:{answer}, 詳解:{len(explanation)} 字")

    return questions


def process_file(file_path):
    """處理單個檔案"""
    print(f"\n處理: {file_path.name}")

    # 從檔名提取題號範圍
    filename = file_path.stem
    match = re.match(r"(\d+)-(\d+)", filename)
    if not match:
        print(f"  警告: 無法從檔名 {filename} 解析題號範圍")
        return []

    start_q = int(match.group(1))
    end_q = int(match.group(2))

    print(f"  題號範圍: {start_q}-{end_q}")

    # 提取文字
    if file_path.suffix.lower() == '.pdf':
        text = extract_from_pdf(file_path)
    elif file_path.suffix.lower() == '.docx':
        text = extract_from_docx(file_path)
    else:
        print(f"  不支援的檔案格式: {file_path.suffix}")
        return []

    if not text:
        print(f"  無法提取文字")
        return []

    # 解析題目
    questions = parse_questions_improved(text, start_q, end_q)

    return questions


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("2023年試題提取工具 (改進版)")
    print("=" * 60)

    # 讀取所有檔案
    files = sorted(TEXT_DIR.glob("*.docx")) + sorted(TEXT_DIR.glob("*.pdf"))

    print(f"\n找到 {len(files)} 個檔案")

    all_questions = []

    for file_path in files:
        questions = process_file(file_path)
        all_questions.extend(questions)

    # 按題號排序
    all_questions.sort(key=lambda x: x['number'])

    print(f"\n" + "=" * 60)
    print(f"共提取 {len(all_questions)} 題")
    print("=" * 60)

    # 檢查缺失的題目
    extracted_nums = set(q['number'] for q in all_questions)
    missing = []
    for i in range(1, 101):
        if i not in extracted_nums:
            missing.append(i)

    if missing:
        print(f"\n缺失題目: {missing}")

    # 生成試卷 JSON
    exam_data = {
        "title": "2023年感染症專科醫師甄審筆試",
        "year": 2023,
        "category": "WRITTEN",
        "questions": []
    }

    for idx, q in enumerate(all_questions):
        question = {
            "order": idx,
            "content": q.get('content', ''),
            "type": "CHOICE",
            "imageUrl": "",
            "imageUrls": [],
            "options": q.get('options', []),
            "correctAnswer": q.get('correctAnswer', ''),
            "answerExplanation": q.get('answerExplanation', '')
        }
        exam_data["questions"].append(question)

    # 儲存 JSON
    output_path = OUTPUT_DIR / "exam_2023_improved.json"
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
    print("1. 檢查生成的 JSON")
    print("2. 使用網頁介面匯入試卷: http://localhost:3000/admin/import")


if __name__ == "__main__":
    main()
