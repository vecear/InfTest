#!/usr/bin/env python3
"""
最終版題目提取工具 - 處理所有編碼問題
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
        print(f"  PDF錯誤: {e}")
        return None


def extract_from_docx_with_encoding(docx_path):
    """從Word文檔提取文字 - 處理不同編碼"""
    try:
        # 方法1: 使用 python-docx (UTF-8)
        from docx import Document
        doc = Document(docx_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

        # 檢查是否有亂碼
        if '�' in text or len(text.strip()) == 0:
            raise ValueError("編碼錯誤或空文件")

        return text
    except Exception as e:
        print(f"  docx讀取失敗: {e}, 嘗試使用zipfile方法...")

        # 方法2: 直接解析XML (處理編碼問題)
        try:
            import zipfile
            from xml.etree import ElementTree as ET

            with zipfile.ZipFile(docx_path) as docx:
                xml_content = docx.read('word/document.xml')

                # 嘗試不同編碼
                for encoding in ['utf-8', 'gbk', 'big5', 'cp950']:
                    try:
                        xml_text = xml_content.decode(encoding)
                        tree = ET.fromstring(xml_text)

                        # 提取所有文字
                        namespaces = {
                            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
                        }

                        text = ""
                        for para in tree.findall('.//w:p', namespaces):
                            para_text = ""
                            for text_elem in para.findall('.//w:t', namespaces):
                                if text_elem.text:
                                    para_text += text_elem.text
                            if para_text:
                                text += para_text + "\n"

                        if text and '�' not in text:
                            print(f"  成功使用 {encoding} 編碼")
                            return text
                    except:
                        continue

        except Exception as e2:
            print(f"  zipfile方法也失敗: {e2}")

        return None


def clean_text(text):
    """清理文字"""
    if not text:
        return text
    # 移除多餘空白
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    return text.strip()


def parse_questions_advanced(text, start_num, end_num):
    """進階題目解析"""
    questions = []

    # 分割整個文本為段落
    lines = text.split('\n')

    for qnum in range(start_num, end_num + 1):
        # 尋找題目開始
        question_start_patterns = [
            rf"^{qnum}\.",
            rf"^{qnum}、",
            rf"^{qnum}\s+",
            rf"\n{qnum}\.",
            rf"\n{qnum}、",
        ]

        question_text = ""
        options = []
        answer = ""
        explanation = ""

        # 找到題目開始位置
        start_idx = -1
        for i, line in enumerate(lines):
            for pattern in question_start_patterns:
                if re.search(pattern, line):
                    start_idx = i
                    break
            if start_idx != -1:
                break

        if start_idx == -1:
            continue

        # 找到題目結束位置 (下一題或文件結束)
        end_idx = len(lines)
        for i in range(start_idx + 1, len(lines)):
            if re.search(rf"^{qnum+1}[\.\s、]", lines[i]):
                end_idx = i
                break

        # 提取這個題目的所有內容
        question_block = "\n".join(lines[start_idx:end_idx])

        # 移除題號前綴
        question_block = re.sub(rf"^{qnum}[\.\s、]+", "", question_block).strip()

        # 分離題目、選項、答案、詳解

        # 1. 提取答案
        answer_match = re.search(r"(?:答案|解)[：:]\s*\(?([ABCDE])\)?", question_block, re.I)
        if answer_match:
            answer = answer_match.group(1).upper()
            # 分割成答案前和答案後
            answer_pos = answer_match.start()
            before_answer = question_block[:answer_pos]
            after_answer = question_block[answer_pos:]

            # 提取詳解
            exp_match = re.search(r"(?:答案|解)[：:]\s*\(?[ABCDE]\)?\s*[。．]?\s*(.*)", after_answer, re.DOTALL | re.I)
            if exp_match:
                explanation = exp_match.group(1).strip()
        else:
            before_answer = question_block
            after_answer = ""

        # 2. 提取選項
        option_patterns = [
            r"\n([ABCDE])[\.、]\s*([^\n]+)",  # A. 或 A、
            r"\n([ABCDE])\s+([^\n]+)",  # A 空格
        ]

        for opt_pattern in option_patterns:
            option_matches = list(re.finditer(opt_pattern, before_answer))
            if len(option_matches) >= 4:
                for match in option_matches:
                    letter = match.group(1).upper()
                    label = match.group(2).strip()
                    options.append({
                        "text": letter,
                        "label": label,
                        "order": ord(letter) - ord('A')
                    })
                # 從題目中移除選項
                first_option_pos = option_matches[0].start()
                question_text = before_answer[:first_option_pos].strip()
                break

        # 如果沒找到選項,整個before_answer就是題目
        if not options:
            question_text = before_answer.strip()
            # 創建默認選項
            for i, letter in enumerate(['A', 'B', 'C', 'D', 'E']):
                options.append({
                    "text": letter,
                    "label": letter,
                    "order": i
                })

        # 清理文字
        question_text = clean_text(question_text)
        explanation = clean_text(explanation)

        if len(question_text) > 0:
            question = {
                "number": qnum,
                "content": question_text,
                "options": options,
                "correctAnswer": answer,
                "answerExplanation": explanation
            }
            questions.append(question)
            print(f"  ✓ 題目 {qnum}: {len(question_text)}字, {len(options)}選項, 答案:{answer}, 解:{len(explanation)}字")

    return questions


def main():
    """主程式"""
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    print("2023年試題提取工具 (最終版)")
    print("=" * 60)

    # 讀取所有檔案
    files = sorted(TEXT_DIR.glob("*.docx")) + sorted(TEXT_DIR.glob("*.pdf"))
    print(f"\n找到 {len(files)} 個檔案")

    all_questions = []

    for file_path in files:
        print(f"\n處理: {file_path.name}")

        # 從檔名提取題號範圍
        match = re.match(r"(\d+)-(\d+)", file_path.stem)
        if not match:
            print(f"  警告: 無法解析題號範圍")
            continue

        start_q = int(match.group(1))
        end_q = int(match.group(2))
        print(f"  題號: {start_q}-{end_q}")

        # 提取文字
        text = None
        if file_path.suffix.lower() == '.pdf':
            text = extract_from_pdf(file_path)
        elif file_path.suffix.lower() == '.docx':
            text = extract_from_docx_with_encoding(file_path)

        if not text:
            print(f"  失敗: 無法提取文字")
            continue

        # 解析題目
        questions = parse_questions_advanced(text, start_q, end_q)
        all_questions.extend(questions)

    # 按題號排序
    all_questions.sort(key=lambda x: x['number'])

    print(f"\n" + "=" * 60)
    print(f"共提取 {len(all_questions)} 題")
    print("=" * 60)

    # 檢查缺失
    extracted_nums = set(q['number'] for q in all_questions)
    missing = [i for i in range(1, 101) if i not in extracted_nums]

    if missing:
        print(f"\n仍缺失 {len(missing)} 題: {missing}")
    else:
        print("\n✓ 100題全部提取成功!")

    # 生成JSON
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

    # 儲存
    output_path = OUTPUT_DIR / "exam_2023.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(exam_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 已生成: {output_path}")

    # 複製到public
    import shutil
    public_output = BASE_DIR / "public" / "scripts" / "output"
    public_output.mkdir(parents=True, exist_ok=True)
    shutil.copy(output_path, public_output / "exam_2023.json")
    print(f"✓ 已複製到: public/scripts/output/exam_2023.json")

    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)
    print("\n下一步: 使用網頁介面匯入")
    print("http://localhost:3000/admin/import")


if __name__ == "__main__":
    main()
