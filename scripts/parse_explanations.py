import re
import json
import sys
import os

def parse_md(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by question numbers "### 1", "### 2", etc.
    questions = re.split(r'\n### (\d+)\n', content)
    
    answers = {}
    explanations = {}

    for i in range(1, len(questions), 2):
        q_num = questions[i]
        q_body = questions[i+1]
        
        # Extract answer: "最不正確的選項：B" or "答案：D"
        ans_match = re.search(r'(?:答案|最不正確的選項|正確答案|正確選項)[：:]\s*([A-E])', q_body)
        if ans_match:
            answers[q_num] = ans_match.group(1)
        
        # Extract explanation: Cleanup images and headers
        # We take everything after the first image or after the answer line
        # For simplicity, we just take the body and strip the image tags
        clean_body = re.sub(r'!\[.*?\]\(.*?\)', '', q_body).strip()
        # Remove the answer line itself from the explanation
        clean_body = re.sub(r'(?:答案|最不正確的選項|正確答案|正確選項)[：:]\s*[A-E]', '', clean_body).strip()
        explanations[q_num] = clean_body

    # Save to JSONs in the same directory as MD
    base_path = os.path.dirname(file_path)
    year = os.path.basename(base_path)
    
    with open(os.path.join(base_path, f"{year}-answers.json"), 'w', encoding='utf-8') as f:
        json.dump(answers, f, ensure_ascii=False, indent=2)
    
    with open(os.path.join(base_path, f"{year}-explanations.json"), 'w', encoding='utf-8') as f:
        json.dump(explanations, f, ensure_ascii=False, indent=2)

    print(f"✅ Parsed {len(answers)} answers and {len(explanations)} explanations.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/parse_explanations.py <path_to_md>")
    else:
        parse_md(sys.argv[1])
