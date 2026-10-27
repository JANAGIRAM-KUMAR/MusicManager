import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "frontend", "public");
const songsSeedPath = path.join(root, "backend", "src", "seeds", "songs.js");

const palette = [
  ["#0f766e", "#22d3ee"],
  ["#4c1d95", "#f472b6"],
  ["#7c2d12", "#fbbf24"],
  ["#1e3a8a", "#60a5fa"],
  ["#581c87", "#a78bfa"],
  ["#064e3b", "#34d399"],
  ["#7f1d1d", "#fb7185"],
  ["#134e4a", "#2dd4bf"],
  ["#312e81", "#818cf8"],
  ["#713f12", "#facc15"],
  ["#831843", "#f9a8d4"],
  ["#164e63", "#67e8f9"],
  ["#365314", "#a3e635"],
  ["#1e293b", "#94a3b8"],
  ["#7e22ce", "#e879f9"],
  ["#9a3412", "#fdba74"],
  ["#0c4a6e", "#38bdf8"],
  ["#3f6212", "#bef264"],
];

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const coverSvg = ({ title, artist, index }) => {
  const [from, to] = palette[index % palette.length];
  const initials = title
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const circles = Array.from({ length: 5 }, (_, i) => {
    const cx = 110 + ((index * 97 + i * 131) % 380);
    const cy = 100 + ((index * 53 + i * 89) % 320);
    const r = 40 + ((index * 31 + i * 67) % 90);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.06)" />`;
  }).join("\n  ");
  const bars = Array.from({ length: 28 }, (_, i) => {
    const height = 18 + Math.abs(Math.sin(index + i * 0.7)) * 96;
    return `<rect x="${72 + i * 16}" y="${420 - height}" width="7" height="${height}" rx="3.5" fill="rgba(255,255,255,0.22)" />`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="20%" r="80%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" />
  <rect width="600" height="600" fill="url(#glow)" />
  ${circles}
  <text x="56" y="330" font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="800" fill="rgba(255,255,255,0.92)">${escapeXml(initials)}</text>
  <text x="60" y="472" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
  <text x="60" y="508" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.75)">${escapeXml(artist)}</text>
  ${bars}
</svg>`;
};

const writeCovers = async (songs, albums) => {
  await mkdir(path.join(publicDir, "cover-images"), { recursive: true });
  await mkdir(path.join(publicDir, "albums"), { recursive: true });

  await Promise.all(
    songs.map(async (song, index) => {
      const target = path.join(
        publicDir,
        song.imageUrl.replace(/^\//, "").replace(/\.jpg$/i, ".svg")
      );
      await writeFile(target, coverSvg({ ...song, index }), "utf8");
    })
  );

  await Promise.all(
    albums.map(async (album, index) => {
      const target = path.join(
        publicDir,
        album.imageUrl.replace(/^\//, "").replace(/\.jpg$/i, ".svg")
      );
      await writeFile(
        target,
        coverSvg({ ...album, index: index + 6 }),
        "utf8"
      );
    })
  );

  console.log(`Wrote ${songs.length + albums.length} SVG covers`);
};

const parseSongs = (source) => {
  const matches = [
    ...source.matchAll(
      /title:\s*"([^"]+)"[\s\S]*?artist:\s*"([^"]+)"[\s\S]*?imageUrl:\s*"([^"]+)"[\s\S]*?songUrl:\s*"([^"]+)"[\s\S]*?duration:\s*(\d+)/g
    ),
  ];

  const unique = new Map();
  for (const match of matches) {
    const [, title, artist, imageUrl, songUrl, duration] = match;
    if (!unique.has(songUrl)) {
      unique.set(songUrl, {
        title,
        artist,
        imageUrl,
        songUrl,
        duration: Number(duration),
      });
    }
  }
  return [...unique.values()].sort((a, b) =>
    a.songUrl.localeCompare(b.songUrl, undefined, { numeric: true })
  );
};

const noteFreq = (base, semitones) => base * 2 ** (semitones / 12);

const renderWav = (song, index) => {
  const sampleRate = 11025;
  const duration = Math.max(8, Math.min(song.duration || 30, 60));
  const totalSamples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(totalSamples * 2);

  const bpm = 82 + ((index * 7) % 46);
  const beatLength = 60 / bpm;
  const base = 98 * 2 ** ((index % 6) / 12);
  const chords = [0, 5, 3, 7];
  const melodyPattern = [0, 3, 7, 10, 7, 3, 5, 0];
  const fade = sampleRate * 0.4;

  let noiseSeed = 12345 + index * 999;

  for (let sample = 0; sample < totalSamples; sample += 1) {
    const time = sample / sampleRate;
    const beat = time / beatLength;
    const bar = Math.floor(beat / 4);
    const chordRoot = noteFreq(base, chords[bar % chords.length]);
    const beatPhase = beat % 1;
    const halfBeat = (beat * 2) % 1;

    const bassEnv = Math.exp(-beatPhase * 4);
    const bass =
      Math.sin(2 * Math.PI * (chordRoot / 2) * time) * 0.22 * bassEnv;

    const pad =
      (Math.sin(2 * Math.PI * chordRoot * time) +
        Math.sin(2 * Math.PI * chordRoot * 2 ** (3 / 12) * time) +
        Math.sin(2 * Math.PI * chordRoot * 2 ** (7 / 12) * time)) *
      0.045 *
      (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.12 * time));

    const step = Math.floor(beat * 2) % melodyPattern.length;
    const melodyFreq = noteFreq(
      chordRoot * 2,
      melodyPattern[step] + (bar % 2 === 0 ? 0 : 2)
    );
    const melodyEnv = Math.exp(-halfBeat * 5);
    const melody =
      (Math.sin(2 * Math.PI * melodyFreq * time) +
        0.25 * Math.sin(2 * Math.PI * melodyFreq * 2 * time)) *
      0.12 *
      melodyEnv;

    const kickPhase = (time % beatLength) / beatLength;
    const kick =
      Math.sin(2 * Math.PI * (52 + 70 * (1 - kickPhase)) * time) *
      0.28 *
      Math.exp(-kickPhase * 18);

    noiseSeed = (noiseSeed * 1103515245 + 12345) & 0x7fffffff;
    const noise = noiseSeed / 0x7fffffff - 0.5;
    const hatPhase = (beat * 2 + 1) % 2;
    const hat = noise * 0.06 * Math.exp(-hatPhase * 30);

    let envelope = 1;
    if (sample < fade) envelope = sample / fade;
    if (sample > totalSamples - fade) envelope = (totalSamples - sample) / fade;

    const mixed = (bass + pad + melody + kick + hat) * 0.55 * envelope;
    const clamped = Math.max(-1, Math.min(1, mixed));
    data.writeInt16LE(Math.round(clamped * 32767), sample * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
};

const writeAudio = async (songs) => {
  const audioDir = path.join(publicDir, "songs");
  await mkdir(audioDir, { recursive: true });

  for (let index = 0; index < songs.length; index += 1) {
    const song = songs[index];
    const name = song.songUrl.split("/").pop().replace(/\.mp3$/i, ".wav");
    await writeFile(path.join(audioDir, name), renderWav(song, index));
  }

  console.log(`Wrote ${songs.length} WAV tracks`);
};

const main = async () => {
  const source = await readFile(songsSeedPath, "utf8");
  const songs = parseSongs(source);
  if (songs.length === 0) {
    throw new Error("Could not parse demo songs from seeds");
  }

  const albums = [
    { title: "Urban Nights", artist: "Various Artists", imageUrl: "/albums/1.jpg" },
    { title: "Coastal Dreaming", artist: "Various Artists", imageUrl: "/albums/2.jpg" },
    { title: "Midnight Sessions", artist: "Various Artists", imageUrl: "/albums/3.jpg" },
    { title: "Eastern Dreams", artist: "Various Artists", imageUrl: "/albums/4.jpg" },
  ];

  await writeCovers(songs, albums);
  await writeAudio(songs);
  console.log("Demo assets ready in frontend/public");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
