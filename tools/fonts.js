// The bundled fonts (SIL Open Font Licence; the licence texts are in src/fonts/licences/), as @font-face rules with the font data
// inside the CSS, so the page needs no network for them. Latin subsets. The interface font (Hanken Grotesk, the only one) is a variable font; the thirty-four
// lettering fonts (Text tool) are only fetched by the browser from this data when a letter is first set in them.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'fonts');
const face = (family, file, weight) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(dir, file)).toString('base64')}) format("woff2")}`;
const TEXT = [['Cinzel', 'cinzel', 700], ['Cinzel Decorative', 'cinzeld', 700], ['IM Fell English', 'fell', 400], ['IM Fell English SC', 'fellsc', 400],
  ['Cormorant Garamond', 'garamond', 700], ['UnifrakturMaguntia', 'frak', 400], ['Pirata One', 'pirata', 400], ['Uncial Antiqua', 'uncial', 400],
  ['MedievalSharp', 'medieval', 400], ['Alfa Slab One', 'alfa', 400], ['Holtwood One SC', 'holtwood', 400], ['Rye', 'rye', 400],
  ['Abril Fatface', 'abril', 400], ['Bebas Neue', 'bebas', 400], ['Playfair Display', 'playfair', 700], ['Bodoni Moda', 'bodoni', 700], ['DM Serif Display', 'dmserif', 400], ['Oswald', 'oswald', 700], ['Anton', 'anton', 400], ['League Gothic', 'leaguegothic', 400], ['Montserrat', 'montserrat', 800], ['Lobster', 'lobster', 400], ['Pacifico', 'pacifico', 400], ['Dancing Script', 'dancing', 700], ['Caveat', 'caveat', 700], ['Permanent Marker', 'marker', 400], ['Special Elite', 'elite', 400], ['Bungee', 'bungee', 400], ['Ultra', 'ultra', 400], ['Vast Shadow', 'vastshadow', 400], ['Limelight', 'limelight', 400], ['Almendra', 'almendra', 700], ['Metamorphous', 'metamorph', 400], ['Grenze Gotisch', 'grenze', 700]];
module.exports = () => [
  face('Hanken Grotesk', 'hanken-grotesk-latin.woff2', '400 600'),
  ...TEXT.map(([fam, id, w]) => face(fam, 'text/' + id + '.woff2', w)),
].join('\n');
