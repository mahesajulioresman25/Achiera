import json
import os

def parse_eslint_report(report_path):
    with open(report_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    unused_items = []
    for entry in data:
        file_path = entry['filePath']
        # Only focus on src directory
        if '\\src\\' not in file_path and '/src/' not in file_path:
            continue
            
        for msg in entry['messages']:
            if msg.get('ruleId') == '@typescript-eslint/no-unused-vars':
                # We specifically look for "never used" which usually indicates an unused import or variable
                if 'never used' in msg['message']:
                    unused_items.append({
                        'file': file_path,
                        'line': msg['line'],
                        'column': msg['column'],
                        'message': msg['message']
                    })
    
    return unused_items

if __name__ == '__main__':
    report_file = 'eslint-report.json'
    if os.path.exists(report_file):
        results = parse_eslint_report(report_file)
        results.sort(key=lambda x: (x['file'], x['line']))
        
        with open('unused_report.txt', 'w', encoding='utf-8') as f:
            f.write(f"Found {len(results)} unused items in src/\n")
            for item in results:
                f.write(f"{item['file']}:{item['line']}:{item['column']}: {item['message']}\n")
        print(f"Results written to unused_report.txt")
    else:

        print("Report file not found")
