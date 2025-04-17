import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [lyrics, setLyrics] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions from Deezer API
  const fetchSuggestions = (term) => {
    if (!term) {
      setSuggestions([]);
      return;
    }
    const callbackName = `deezerSuggest_${Date.now()}`;
    window[callbackName] = (data) => {
      if (data && data.data) {
        setSuggestions(data.data.slice(0, 8)); // Limit to 8 suggestions
        setShowSuggestions(true);
      }
      delete window[callbackName];
      document.body.removeChild(document.getElementById(callbackName));
    };
    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(
      term,
    )}&output=jsonp&callback=${callbackName}`;
    document.body.appendChild(script);
  };

  // Debounce input
  const debounceTimeout = useRef(null);
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setLyrics("");
    setSelectedTrack(null);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Play preview audio
  const playPreview = (url) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  // Stop preview audio
  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  // Fetch lyrics when suggestion is selected
  const selectSuggestion = (track) => {
    setSelectedTrack(track);
    setShowSuggestions(false);
    setLyrics("");
    stopPreview();
    fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(
        track.artist.name,
      )}/${encodeURIComponent(track.title)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setLyrics(data.lyrics || "Lyrics not found.");
      })
      .catch(() => setLyrics("Lyrics not found."));
  };

  // Handle preview button in lyrics section
  const handleLyricsPreview = () => {
    if (!selectedTrack) return;
    if (isPlaying) {
      stopPreview();
    } else {
      playPreview(selectedTrack.preview);
    }
  };

  return (
    <div className="app">
      <h1>SoundOfLife 🎵</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search for songs or artists"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="search-input"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((track) => (
              <li
                key={track.id}
                className="suggestion-item"
                onClick={() => selectSuggestion(track)}
              >
                <img
                  src={track.album.cover_medium}
                  alt="cover"
                  className="suggestion-image"
                />
                <span className="suggestion-info">
                  <span className="suggestion-title">{track.title}</span>
                  <span className="suggestion-artist">
                    {" "}
                    — {track.artist.name}
                  </span>
                </span>
                {track.preview && (
                  <button
                    className="preview-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlaying) {
                        stopPreview();
                      } else {
                        playPreview(track.preview);
                      }
                    }}
                  >
                    {isPlaying ? "⏸️" : "▶️"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Song and lyrics display */}
      {selectedTrack && (
        <div className="lyrics-container">
          <div className="song-header">
            <img
              className="album-cover"
              src={selectedTrack.album.cover_medium}
              alt="cover"
            />
            <div className="song-info">
              <div className="lyrics-title">
                {selectedTrack.title} — {selectedTrack.artist.name}
              </div>
              {selectedTrack.preview && (
                <button className="preview-btn" onClick={handleLyricsPreview}>
                  {isPlaying ? "Pause Preview" : "Play Preview"}
                </button>
              )}
            </div>
          </div>
          <div className="the-lyrics">
            {lyrics ? lyrics : "Loading lyrics..."}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
