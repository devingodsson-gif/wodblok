#!/usr/bin/env python3
"""One-off helper (not part of the build): turn the lettering fonts (.woff2 or .ttf/.otf) into .woff files with overlapping contours merged.
The Text tool reads the real letter outlines from these files (opentype.js cannot read .woff2), and the browser uses the same files for display.
Needs: pip install fonttools brotli skia-pathops.   Usage: python3 tools/fonts-to-woff.py FROM_DIR TO_DIR
"""
import glob, os, sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, '*.woff2')) + glob.glob(os.path.join(src, '*.ttf')) + glob.glob(os.path.join(src, '*.otf'))):
    t = TTFont(f)
    if 'glyf' not in t:
        raise SystemExit(f + ': only TrueType outlines (glyf) are supported')
    removeOverlaps(t)
    t.flavor = 'woff'
    out = os.path.join(dst, os.path.splitext(os.path.basename(f))[0] + '.woff')
    t.save(out)
    print(os.path.basename(out), os.path.getsize(out))
