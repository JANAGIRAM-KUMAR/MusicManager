import https from "https";

const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "SpotifyClone/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, json: async () => JSON.parse(data) });
          } else {
            resolve({ ok: false, status: res.statusCode, json: async () => JSON.parse(data || "{}") });
          }
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, json: async () => ({}) });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => req.destroy(new Error("timeout")));
  });
};

export const getLyrics = async (req, res) => {
  try {
    const artist = encodeURIComponent(req.query.artist || "");
    const track = encodeURIComponent(req.query.track || "");
    const album = encodeURIComponent(req.query.album || "");
    const duration = req.query.duration;

    if (!artist || !track) {
      return res.status(400).json({ success: false, message: "artist and track are required" });
    }

    // Try lrclib get by track/artist/duration
    const tryGet = async (a, t, d) => {
      let url = `https://lrclib.net/api/get?artist_name=${a}&track_name=${t}`;
      if (d) url += `&duration=${d}`;
      const response = await httpsGet(url);
      if (response.ok) {
        const data = await response.json();
        if (data.syncedLyrics || data.plainLyrics) return data;
      }
      return null;
    };

    // Try search and pick best match
    const trySearch = async (a, t) => {
      const searchUrl = `https://lrclib.net/api/search?track_name=${t}&artist_name=${a}`;
      try {
        const response = await httpsGet(searchUrl);
        if (!response.ok) return null;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Prefer synced lyrics
          const withSynced = data.find((d) => d.syncedLyrics);
          return withSynced || data[0];
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    let data = await tryGet(artist, track, duration);
    if (!data) data = await trySearch(artist, track);
    if (!data && album) {
      // sometimes album helps with search
      const searchUrl = `https://lrclib.net/api/search?track_name=${track}&album_name=${album}`;
      try {
        const response = await httpsGet(searchUrl);
        if (response.ok) {
          const arr = await response.json();
          if (Array.isArray(arr) && arr.length > 0) {
            data = arr.find((d) => d.syncedLyrics) || arr[0];
          }
        }
      } catch (e) {}
    }

    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      return res.status(404).json({ success: false, message: "Lyrics not found" });
    }

    return res.status(200).json({
      success: true,
      lyrics: {
        plainLyrics: data.plainLyrics || "",
        syncedLyrics: data.syncedLyrics || "",
        instrumental: data.instrumental || false,
        id: data.id,
      },
    });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch lyrics" });
  }
};
