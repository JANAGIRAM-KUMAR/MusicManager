export interface LyricLine {
  id: number;
  time: number;
  text: string;
}

export const parseLrc = (lrcString: string): LyricLine[] => {
  if (!lrcString || typeof lrcString !== "string") return [];
  const lines = lrcString.split("\n");
  const parsed: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  let counter = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    const text = line.replace(timeRegex, "").trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        const msStr = match[3];
        if (msStr.length === 1) ms = parseInt(msStr, 10) * 100;
        else if (msStr.length === 2) ms = parseInt(msStr, 10) * 10;
        else ms = parseInt(msStr.slice(0, 3), 10);
      }
      const time = minutes * 60 + seconds + ms / 1000;

      parsed.push({
        id: counter++,
        time,
        text,
      });
    }
  }

  return parsed.sort((a, b) => a.time - b.time);
};

export const getActiveLyricIndex = (
  lines: LyricLine[],
  currentTime: number,
  offsetSeconds = 0.15
): number => {
  if (!lines || lines.length === 0) return -1;
  let activeIndex = -1;
  const timeWithOffset = currentTime + offsetSeconds;

  for (let i = 0; i < lines.length; i++) {
    if (timeWithOffset >= lines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
};
