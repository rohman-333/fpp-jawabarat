import os

root = r"c:\Users\ASUS\Documents\fpp-jawabarat"
extensions = {'.tsx', '.ts'}
skip_dirs = {'node_modules', '.next', '.git'}

replacements = [
    ("'/auth/login'", "'/login'"),
    ('"/auth/login"', '"/login"'),
    ("`/auth/login`", "`/login`"),
    ("'/auth/register'", "'/register'"),
    ('"/auth/register"', '"/register"'),
    ("`/auth/register`", "`/register`"),
    ("href=\"/auth/login\"", "href=\"/login\""),
    ("href=\"/auth/register\"", "href=\"/register\""),
]

changed_files = []
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for filename in filenames:
        ext = os.path.splitext(filename)[1]
        if ext not in extensions: continue
        
        filepath = os.path.join(dirpath, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                changed_files.append(filepath)
        except:
            pass

print(f"Changed {len(changed_files)} files.")
for f in changed_files:
    print(f"  {f}")
