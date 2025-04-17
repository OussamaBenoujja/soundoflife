import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [lyrics, setLyrics] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [copied, setCopied] = useState(false);
  const searchTimeoutRef = useRef(null);
  const apiUrl = "https://api.lyrics.ovh";

  // Use placeholder images instead of CDN images
  const albumPlaceholder =
    "https://placehold.co/250x250/3498db/ffffff?text=Album";
  const artistPlaceholder =
    "https://placehold.co/250x250/34495e/ffffff?text=Artist";

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const fetchSuggestions = async () => {
    try {
      console.log("Search suggestions for", searchTerm);
      const response = await fetch(
        `${apiUrl}/suggest/${encodeURIComponent(searchTerm)}`,
      );
      const data = await response.json();

      const finalResults = [];
      const seenResults = [];

      data.data.forEach((result) => {
        if (seenResults.length >= 5) {
          return;
        }

        const displayText = `${result.title} - ${result.artist.name}`;

        if (seenResults.indexOf(displayText) >= 0) {
          return;
        }

        seenResults.push(displayText);
        finalResults.push({
          display: displayText,
          artist: result.artist.name,
          title: result.title,
          // Using placeholders instead of actual image URLs
          albumArt: albumPlaceholder,
          artistImage: artistPlaceholder,
        });
      });

      setSearchResults(finalResults);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchLyrics = async (song) => {
    try {
      console.log("Search lyrics for", song);
      setSelectedSong(song);
      setSearchResults([]);
      setShowLyrics(false);

      const response = await fetch(
        `${apiUrl}/v1/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.title)}`,
      );
      const data = await response.json();

      if (data.lyrics) {
        setLyrics(data.lyrics);
        setShowLyrics(true);
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
    }
  };

  const copyToClipboard = () => {
    if (lyrics) {
      navigator.clipboard
        .writeText(lyrics)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err);
        });
    }
  };

  const isChrome = () => {
    const isChromium = window.chrome;
    const winNav = window.navigator;
    const vendorName = winNav.vendor;
    const isOpera = winNav.userAgent.indexOf("OPR") > -1;
    const isIEedge = winNav.userAgent.indexOf("Edge") > -1;
    const isIOSChrome = winNav.userAgent.match("CriOS");

    return (
      isIOSChrome ||
      (isChromium !== null &&
        isChromium !== undefined &&
        vendorName === "Google Inc." &&
        isOpera === false &&
        isIEedge === false)
    );
  };

  // Generate a random color based on string input (for album/artist visual distinction)
  const getColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    return "#" + "0".repeat(6 - color.length) + color;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lyrics Search</h1>
        <div className="search-container">
          <input
            type="text"
            id="search-input"
            placeholder="Search for a song or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchResults.length > 0 && (
            <ul className="results">
              {searchResults.map((result, index) => (
                <li
                  key={index}
                  className={`result ${index === searchResults.length - 1 ? "result-last" : ""}`}
                  onClick={() => fetchLyrics(result)}
                >
                  <div
                    className="placeholder-image result-image"
                    style={{
                      backgroundColor: getColorFromString(result.title),
                    }}
                  >
                    <span>{result.title.charAt(0)}</span>
                  </div>
                  <span className="result-text">{result.display}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {showLyrics && selectedSong && (
        <div className="lyrics-container">
          <div className="song-header">
            <div
              className="placeholder-image album-cover"
              style={{
                backgroundColor: getColorFromString(selectedSong.title),
              }}
            >
              <span>{selectedSong.title.charAt(0)}</span>
            </div>
            <div className="song-info">
              <h3 className="lyrics-title">{selectedSong.display}</h3>
              <div className="artist-info">
                <div
                  className="placeholder-image artist-image"
                  style={{
                    backgroundColor: getColorFromString(selectedSong.artist),
                  }}
                >
                  <span>{selectedSong.artist.charAt(0)}</span>
                </div>
                <span className="artist-name">{selectedSong.artist}</span>
              </div>
              <div className="copy-lyrics" onClick={copyToClipboard}>
                <span>Copy the lyrics</span>
                <span className="clipboard-icon">📋</span>
                {copied && <span className="copy-ok"> - Done :-)</span>}
              </div>
            </div>
          </div>

          <div className="the-lyrics">
            {lyrics.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {isChrome() && (
        <div id="dl-chrome-ext" className="chrome-extension">
          <a href="#" className="chrome-ext-link">
            Download Chrome Extension
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
