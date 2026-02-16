#!/usr/bin/env python3
import re

# Read the file
with open('/supabase/functions/server/index.tsx', 'r') as f:
    content = f.read()

# Replace all instances EXCEPT the one on line 131 (which is inside getUserWithRetry function)
# We need to be careful not to replace the line inside the getUserWithRetry function itself
lines = content.split('\n')
replaced_count = 0

for i, line in enumerate(lines):
    line_num = i + 1
    # Skip line 131 which is inside getUserWithRetry
    if line_num == 131:
        continue
    
    # Replace the pattern
    if 'await supabase.auth.getUser(accessToken)' in line:
        lines[i] = line.replace('await supabase.auth.getUser(accessToken)', 'await getUserWithRetry(accessToken)')
        replaced_count += 1
        print(f"Replaced on line {line_num}")

# Write back
content = '\n'.join(lines)
with open('/supabase/functions/server/index.tsx', 'w') as f:
    f.write(content)

print(f"\nTotal replacements: {replaced_count}")
