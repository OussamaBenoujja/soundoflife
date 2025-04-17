import React, { useState } from "react";

function App() {
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  const searchLyrics = async () => {
    setLyrics("");
    setPreviewUrl("");
    setCoverUrl("");
    setIsPlaying(false);
    if (audio) {
      audio.pause();
      setAudio(null);
    }

    // Lyrics API
    try {
      const lyricsRes = await fetch(
        `https://api.lyrics.ovh/v1/${artist}/${song}`,
      );
      const lyricsData = await lyricsRes.json();
      if (lyricsData.lyrics) {
        setLyrics(lyricsData.lyrics);
      } else {
        setLyrics("Lyrics not found.");
      }
    } catch (err) {
      setLyrics("Failed to fetch lyrics.");
    }

    // Deezer API (JSONP workaround)
    const callbackName = `jsonpCallback_${Date.now()}`;
    window[callbackName] = (data) => {
      if (data && data.data && data.data.length > 0) {
        const track = data.data[0];
        setPreviewUrl(track.preview);
        setCoverUrl(track.album.cover_medium);
      }
      document.body.removeChild(script); // Clean up
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://api.deezer.com/search?q=artist:"${artist}" track:"${song}"&output=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
  };

  const togglePlay = () => {
    if (!previewUrl) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(previewUrl);
      newAudio.play();
      setAudio(newAudio);
      setIsPlaying(true);
      newAudio.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h1>Lyrics Finder 🎵</h1>

      <input
        type="text"
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        style={{ marginRight: 10 }}
      />
      <input
        type="text"
        placeholder="Song"
        value={song}
        onChange={(e) => setSong(e.target.value)}
      />
      <button onClick={searchLyrics} style={{ marginLeft: 10 }}>
        Search
      </button>

      {coverUrl && (
        <div style={{ marginTop: 20 }}>
          <img src={coverUrl} alt="Cover" width={200} height={200} />
          <div>
            <button onClick={togglePlay} style={{ marginTop: 10 }}>
              {isPlaying ? "Pause Preview" : "Play Preview"}
            </button>
          </div>
        </div>
      )}

      {lyrics && (
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{lyrics}</pre>
      )}
    </div>
  );
}

export default App;
