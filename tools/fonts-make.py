# Makes the lettering fonts added in 2.66.0 (docs/text-plan.md release 4) from a checkout of github.com/google/fonts (OFL and Apache licences).
# Each family: regular, and bold, italic and bold italic where the family has them, as Latin-subset .woff files in src/fonts/text/
# (<id>.woff, <id>-b.woff, <id>-i.woff, <id>-bi.woff), and its licence in src/fonts/licences/. The app needs no network for them.
# Run: python3 tools/fonts-make.py <path to the google/fonts checkout>   (needs fontTools)
import io, os, re, sys, shutil
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'fonts')
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
# id, google/fonts folder, family name shown, group, what it is
FONTS = [
    ('lora', 'ofl/lora', 'Lora', 'Serif', 'Book serif'), ('merriweather', 'ofl/merriweather', 'Merriweather', 'Serif', 'Sturdy serif'),
    ('baskerville', 'ofl/librebaskerville', 'Libre Baskerville', 'Serif', 'Classic book serif'), ('crimson', 'ofl/crimsonpro', 'Crimson Pro', 'Serif', 'Old-style serif'),
    ('ebgaramond', 'ofl/ebgaramond', 'EB Garamond', 'Serif', 'Garamond'), ('spectral', 'ofl/spectral', 'Spectral', 'Serif', 'Screen serif'),
    ('alegreya', 'ofl/alegreya', 'Alegreya', 'Serif', 'Calligraphic serif'), ('ptserif', 'ofl/ptserif', 'PT Serif', 'Serif', 'Plain serif'),
    ('inter', 'ofl/inter', 'Inter', 'Sans', 'Neutral sans'), ('worksans', 'ofl/worksans', 'Work Sans', 'Sans', 'Grotesque sans'),
    ('raleway', 'ofl/raleway', 'Raleway', 'Sans', 'Elegant sans'), ('lato', 'ofl/lato', 'Lato', 'Sans', 'Friendly sans'),
    ('nunito', 'ofl/nunito', 'Nunito', 'Sans', 'Rounded sans'), ('poppins', 'ofl/poppins', 'Poppins', 'Sans', 'Geometric sans'),
    ('plexsans', 'ofl/ibmplexsans', 'IBM Plex Sans', 'Sans', 'Technical sans'), ('firasans', 'ofl/firasans', 'Fira Sans', 'Sans', 'Humanist sans'),
    ('karla', 'ofl/karla', 'Karla', 'Sans', 'Quirky grotesque'), ('rubik', 'ofl/rubik', 'Rubik', 'Sans', 'Soft corners'),
    ('dmsans', 'ofl/dmsans', 'DM Sans', 'Sans', 'Low-contrast sans'), ('josefin', 'ofl/josefinsans', 'Josefin Sans', 'Sans', 'Vintage geometric'),
    ('robotoslab', 'apache/robotoslab', 'Roboto Slab', 'Slab', 'Modern slab'), ('arvo', 'ofl/arvo', 'Arvo', 'Slab', 'Geometric slab'),
    ('zillaslab', 'ofl/zillaslab', 'Zilla Slab', 'Slab', 'Contemporary slab'), ('bitter', 'ofl/bitter', 'Bitter', 'Slab', 'Reading slab'),
    ('righteous', 'ofl/righteous', 'Righteous', 'Display', 'Rounded deco'), ('fredoka', 'ofl/fredoka', 'Fredoka', 'Display', 'Round and playful'),
    ('staatliches', 'ofl/staatliches', 'Staatliches', 'Display', 'Poster capitals'), ('archivoblack', 'ofl/archivoblack', 'Archivo Black', 'Display', 'Heavy grotesque'),
    ('shrikhand', 'ofl/shrikhand', 'Shrikhand', 'Display', 'Bold italic display'), ('monoton', 'ofl/monoton', 'Monoton', 'Display', 'Neon lines'),
    ('titanone', 'ofl/titanone', 'Titan One', 'Display', 'Chunky'), ('luckiestguy', 'apache/luckiestguy', 'Luckiest Guy', 'Display', 'Cartoon'),
    ('passionone', 'ofl/passionone', 'Passion One', 'Display', 'Heavy rounded'), ('chango', 'ofl/chango', 'Chango', 'Display', 'Fat display'),
    ('bowlby', 'ofl/bowlbyonesc', 'Bowlby One SC', 'Display', 'Heavy small caps'), ('yeseva', 'ofl/yesevaone', 'Yeseva One', 'Display', 'Feminine serif'),
    ('greatvibes', 'ofl/greatvibes', 'Great Vibes', 'Script', 'Formal script'), ('satisfy', 'apache/satisfy', 'Satisfy', 'Script', 'Brush script'),
    ('sacramento', 'ofl/sacramento', 'Sacramento', 'Script', 'Monoline script'), ('parisienne', 'ofl/parisienne', 'Parisienne', 'Script', 'French script'),
    ('kaushan', 'ofl/kaushanscript', 'Kaushan Script', 'Script', 'Brush lettering'), ('yellowtail', 'apache/yellowtail', 'Yellowtail', 'Script', 'Retro script'),
    ('allura', 'ofl/allura', 'Allura', 'Script', 'Copperplate script'),
    ('newrocker', 'ofl/newrocker', 'New Rocker', 'Blackletter', 'Rock blackletter'), ('frakcook', 'ofl/unifrakturcook', 'UnifrakturCook', 'Blackletter', 'Heavy fraktur'),
    ('jacquard', 'ofl/jacquard24', 'Jacquard 24', 'Blackletter', 'Pixel blackletter'),
    ('indieflower', 'ofl/indieflower', 'Indie Flower', 'Handwritten', 'Bubbly hand'), ('shadows', 'ofl/shadowsintolight', 'Shadows Into Light', 'Handwritten', 'Felt-tip hand'),
    ('patrickhand', 'ofl/patrickhand', 'Patrick Hand', 'Handwritten', 'Neat hand'), ('gloria', 'ofl/gloriahallelujah', 'Gloria Hallelujah', 'Handwritten', 'Comic hand'),
    ('architects', 'ofl/architectsdaughter', 'Architects Daughter', 'Handwritten', 'Drafting hand'), ('amatic', 'ofl/amaticsc', 'Amatic SC', 'Handwritten', 'Tall hand capitals'),
    ('spacemono', 'ofl/spacemono', 'Space Mono', 'Mono', 'Geometric mono'), ('plexmono', 'ofl/ibmplexmono', 'IBM Plex Mono', 'Mono', 'Technical mono'),
    ('courier', 'ofl/courierprime', 'Courier Prime', 'Mono', 'Typewriter mono'), ('jetbrains', 'ofl/jetbrainsmono', 'JetBrains Mono', 'Mono', 'Code mono'),
]

def pick(files, italic, bold):
    """the static file for a style, or (variable file, weight)"""
    stat = {f.lower(): f for f in files if '[' not in f}
    want = ('bold' if bold else 'regular') + ('italic' if italic else '')
    for f in files:
        b = re.sub(r'\.ttf$', '', f, flags=re.I).split('-')[-1].lower()
        if '[' in f:
            continue
        if b == want or (want == 'regularitalic' and b == 'italic') or (want == 'regular' and len([x for x in files if '[' not in x]) == 1 and not italic and not bold):
            return f, None
    for f in files:
        if '[' in f and (('italic' in f.lower()) == italic):
            return f, 700 if bold else 400
    return None, None

def make(src, path, wght):
    font = TTFont(src)
    if wght is not None and 'fvar' in font:
        axes = {a.axisTag: (min(max(wght, a.minValue), a.maxValue) if a.axisTag == 'wght' else a.defaultValue) for a in font['fvar'].axes}
        if 'wght' in axes and not (font['fvar'].axes[[a.axisTag for a in font['fvar'].axes].index('wght')].minValue <= wght <= font['fvar'].axes[[a.axisTag for a in font['fvar'].axes].index('wght')].maxValue):
            return False
        font = instancer.instantiateVariableFont(font, axes)
    opts = subset.Options(); opts.flavor = 'woff'; opts.hinting = False; opts.desubroutinize = True; opts.layout_features = ['kern', 'liga', 'calt']; opts.name_IDs = ['*']
    s = subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(LATIN)); s.subset(font)
    subset.save_font(font, path, opts); return True

def main(gf):
    out = []
    for fid, folder, fam, grp, desc in FONTS:
        d = os.path.join(gf, folder); files = sorted(f for f in os.listdir(d) if f.lower().endswith('.ttf'))
        have = []
        for suf, it, bo in (('', False, False), ('-b', False, True), ('-i', True, False), ('-bi', True, True)):
            f, w = pick(files, it, bo)
            if not f:
                if suf == '':   # a family with one weight only (display, script, a bold-only face): that file is its regular
                    f, w = files[0], (400 if '[' in files[0] else None)
                else:
                    continue
            if suf and f == pick(files, False, False)[0] and w is None:
                continue
            if make(os.path.join(d, f), os.path.join(ROOT, 'text', fid + suf + '.woff'), w):
                have.append(suf)
        lic = next((x for x in ('OFL.txt', 'LICENSE.txt') if os.path.exists(os.path.join(d, x))), None)
        if lic:
            shutil.copy(os.path.join(d, lic), os.path.join(ROOT, 'licences', ('OFL-' if lic == 'OFL.txt' else 'LICENSE-Apache-') + fid + '.txt'))
        out.append((fid, fam, grp, desc, have))
        print(fid, have)
    return out

if __name__ == '__main__':
    main(sys.argv[1])
