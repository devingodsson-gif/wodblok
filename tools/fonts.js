// The bundled fonts (SIL Open Font Licence; the licence texts are in src/fonts/licences/), as @font-face rules with the font data
// inside the CSS, so the page needs no network for them. Latin subsets. The two interface fonts are variable fonts; the fourteen
// lettering fonts (Text tool) are only fetched by the browser from this data when a letter is first set in them.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'fonts');
const face = (family, file, weight) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, file)).toString('base64')}) format("woff2")}`;
const TEXT = [['Cinzel', 'cinzel', 700], ['Cinzel Decorative', 'cinzeld', 700], ['IM Fell English', 'fell', 400], ['IM Fell English SC', 'fellsc', 400],
  ['Cormorant Garamond', 'garamond', 700], ['UnifrakturMaguntia', 'frak', 400], ['Pirata One', 'pirata', 400], ['Uncial Antiqua', 'uncial', 400],
  ['MedievalSharp', 'medieval', 400], ['Alfa Slab One', 'alfa', 400], ['Holtwood One SC', 'holtwood', 400], ['Rye', 'rye', 400],
  ['Abril Fatface', 'abril', 400], ['Bebas Neue', 'bebas', 400]];
module.exports = () => [
  face('Fraunces', 'fraunces-latin.woff2', '500 600'), face('Hanken Grotesk', 'hanken-grotesk-latin.woff2', '400 600'),
  ...TEXT.map(([fam, id, w]) => face(fam, 'text/' + id + '.woff2', w)),
].join('\n');
