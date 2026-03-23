import re

# Regex pattern to match emojis
emoji_pattern = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002700-\U000027BF"  # Dingbats
    "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
    "\U00002600-\U000026FF"  # Misc symbols
    "\U00002B00-\U00002BFF"  # Misc symbols & arrows
    "\U0001FA70-\U0001FAFF"  # Symbols & Pictographs Extended-A
    "]+",
    flags=re.UNICODE
)

def remove_emojis_from_file(input_path, output_path=None):
    if output_path is None:
        output_path = input_path  # overwrite by default
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    cleaned_content = emoji_pattern.sub(r'', content)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    print(f"Emojis removed from {input_path}")

# Example usage
remove_emojis_from_file("README.md")  # overwrite original
# Or specify a new file
# remove_emojis_from_file("README.md", "README_clean.md")