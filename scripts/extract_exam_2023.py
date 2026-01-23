#!/usr/bin/env python3
"""
從2023年文字檔案中提取題目和詳解
支援 Word (.docx) 和 PDF 檔案
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
    except ImportError:
        print("需要安裝 PyPDF2: pip install PyPDF2")
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
    except ImportError:
        print("需要安裝 python-docx: pip install python-docx")
        return None


def parse_question(text, question_number):
    """解析單個題目"""
    # 匹配題目編號和內容
    pattern = rf"{question_number}\.\s*(.*?)(?=\n(?:[ABCDE]\.|答案|解))"
    match = re.search(pattern, text, re.DOTALL)

    if not match:
        return None

    question_text = match.group(1).strip()

    # 提取選項
    options = []
    option_pattern = r"([ABCDE])\.\s*([^\n]+)"
    option_matches = re.finditer(option_pattern, text[match.end():])

    for opt_match in option_matches:
        options.append({
            "text": opt_match.group(1),
            "order": ord(opt_match.group(1)) - ord('A')
        })
        if len(options) >= 5:  # 最多5個選項
            break

    # 提取答案
    answer_pattern = rf"答案[：:]\s*([ABCDE])"
    answer_match = re.search(answer_pattern, text[match.end():])
    correct_answer = answer_match.group(1) if answer_match else ""

    # 提取詳解
    explanation = ""
    exp_pattern = rf"答案[：:]\s*[ABCDE][。．]\s*(.*?)(?=\n\n|\n\d+\.|\Z)"
    exp_match = re.search(exp_pattern, text[match.end():], re.DOTALL)
    if exp_match:
        explanation = exp_match.group(1).strip()

    return {
        "number": question_number,
        "content": question_text,
        "options": options,
        "correctAnswer": correct_answer,
        "answerExplanation": explanation
    }


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
    questions = []
    for q_num in range(start_q, end_q + 1):
        question = parse_question(text, q_num)
        if question:
            questions.append(question)
            print(f"  ✓ 題目 {q_num}")
        else:
            print(f"  ✗ 題目 {q_num} 解析失敗")

    return questions


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("2023年試題提取工具")
    print("=" * 60)

    # 安裝必要套件
    print("\n檢查必要套件...")
    try:
        import PyPDF2
        print("✓ PyPDF2 已安裝")
    except ImportError:
        print("安裝 PyPDF2...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])

    try:
        import docx
        print("✓ python-docx 已安裝")
    except ImportError:
        print("安裝 python-docx...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])

    # 讀取所有檔案
    files = sorted(TEXT_DIR.glob("*.docx")) + sorted(TEXT_DIR.glob("*.pdf"))

    print(f"\n找到 {len(files)} 個檔案")

    all_questions = []

    for file_path in files:
        questions = process_file(file_path)
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
        question = {
            "order": idx,
            "content": q['content'],
            "type": "CHOICE",
            "imageUrl": "",
            "imageUrls": [],
            "options": q['options'],
            "correctAnswer": q['correctAnswer'],
            "answerExplanation": q['answerExplanation']
        }
        exam_data["questions"].append(question)

    # 儲存 JSON
    output_path = OUTPUT_DIR / "exam_2023.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 已生成 JSON: {output_path}")

    # 複製到 public 目錄
    print("\n複製 JSON 到 public 目錄...")
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)
    shutil.copy(output_path, public_output / output_path.name)
    print(f"  已複製: {output_path.name}")

    print("\n" + "=" * 60)
    print("處理完成！")
    print("=" * 60)
    print("\n下一步:")
    print("1. 檢查生成的 JSON: scripts/output/exam_2023.json")
    print("2. 使用網頁介面匯入試卷: http://localhost:3000/admin/import")


if __name__ == "__main__":
    main()
