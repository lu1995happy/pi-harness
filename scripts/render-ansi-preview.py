"""Render a Herdr ANSI snapshot for inspection, not an OS screenshot.

Usage: python render-ansi-preview.py snapshot.ansi preview.png font.ttf
"""
import re, sys
from PIL import Image, ImageDraw, ImageFont

source, target, font_path = sys.argv[1:]
lines = open(source, encoding='utf-8').read().splitlines()
start = next((i for i, line in enumerate(lines) if 'STYLE PREVIEW' in line), 0)
lines = lines[start:]
while lines and not re.sub(r'\x1b\[[0-9;]*m', '', lines[-1]).strip():
    lines.pop()
font = ImageFont.truetype(font_path, 18)
cell, row = 11, 27
width = max(len(re.sub(r'\x1b\[[0-9;]*m', '', line)) for line in lines)
image = Image.new('RGB', (width * cell + 32, len(lines) * row + 48), '#141722')
draw = ImageDraw.Draw(image)
draw.text((16, 6), 'Actual Pi ANSI snapshot / reconstructed font rendering', font=font, fill='#989fb5')
base = ['#171923','#d87979','#91d1a6','#f5d372','#78b9df','#bea6e6','#64d3e5','#d9dfed']
def indexed(n):
    if n < 16: return base[n % 8]
    if n >= 232: return tuple([8 + (n - 232) * 10] * 3)
    n -= 16
    levels = [0, 95, 135, 175, 215, 255]
    return (levels[n//36], levels[(n//6)%6], levels[n%6])
fg, bg = '#d9dfed', '#141722'
for y, line in enumerate(lines):
    x = 16
    for token in re.split(r'(\x1b\[[0-9;]*m)', line):
        if token.startswith('\x1b['):
            codes = [int(n or 0) for n in token[2:-1].split(';')]
            i = 0
            while i < len(codes):
                code = codes[i]
                if code == 0: fg, bg = '#d9dfed', '#141722'
                elif code == 39: fg = '#d9dfed'
                elif code == 49: bg = '#141722'
                elif 30 <= code <= 37: fg = base[code-30]
                elif 40 <= code <= 47: bg = base[code-40]
                elif code in (38, 48) and i+2 < len(codes):
                    mode = codes[i+1]
                    color = tuple(codes[i+2:i+5]) if mode == 2 else indexed(codes[i+2])
                    if code == 38: fg = color
                    else: bg = color
                    i += 4 if mode == 2 else 2
                i += 1
        else:
            for char in token:
                draw.rectangle((x, 36+y*row, x+cell-1, 36+(y+1)*row-1), fill=bg)
                draw.text((x, 37+y*row), char, font=font, fill=fg)
                x += cell
image.save(target)
print(target)
