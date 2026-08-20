import sharp from "sharp";

const width = 600;
const height = 375;
const gap = 12;

async function tile(name, theme) {
  const label = `${name.toUpperCase()} / ${theme.toUpperCase()}`;
  const overlay = Buffer.from(`<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="230" height="28" fill="#111315"/>
    <text x="10" y="19" fill="#f2efe6" font-family="monospace" font-size="12" font-weight="700">${label}</text>
  </svg>`);
  return sharp(`.qa/theme/${name}-${theme}.png`)
    .resize(width, height, { fit: "cover", position: "top" })
    .composite([{ input: overlay }])
    .png()
    .toBuffer();
}

async function sheet(output, names) {
  const canvas = sharp({
    create: {
      width: width * 2 + gap,
      height: names.length * height + (names.length - 1) * gap,
      channels: 3,
      background: "#343434",
    },
  });
  const composites = [];
  for (let row = 0; row < names.length; row += 1) {
    composites.push({ input: await tile(names[row], "dark"), left: 0, top: row * (height + gap) });
    composites.push({ input: await tile(names[row], "light"), left: width + gap, top: row * (height + gap) });
  }
  await canvas.composite(composites).png().toFile(`.qa/theme/${output}.png`);
}

await sheet("contact-home", ["home-intro", "home-takeover", "home-takeover-final", "home-about", "home-events", "home-projects", "home-team", "home-join"]);
await sheet("contact-pages", ["events", "archive", "projects", "team", "resources", "achievements", "event-detail"]);
await sheet("contact-content", ["events-content", "archive-content", "projects-content", "team-content", "resources-content", "achievements-content", "event-detail-content"]);
