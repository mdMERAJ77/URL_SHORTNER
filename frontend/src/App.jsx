import { useState } from "react";
import axios from "axios";

const App = () => {
  const API = "https://url-shortner-9asj.onrender.com";
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!originalUrl) {
      setError("Please enter a URL");
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setError("Please enter a valid URL (include http:// or https://)");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(`${API}/api/short`, 
        { originalUrl: originalUrl.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      console.log("API Response:", response.data);
      setShortUrl(response.data);
      setOriginalUrl("");
    } catch (err) {
      console.error("Full error:", err);
      if (err.code === 'ERR_NETWORK') {
        setError("Network error. Please check if backend server is running.");
      } else if (err.response) {
        setError(err.response.data?.message || "Server error");
      } else {
        setError("Failed to shorten URL. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shortUrl?.shortUrl) {
      await navigator.clipboard.writeText(shortUrl.shortUrl);
      alert("✅ Copied!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔗 URL Shortener
          </h1>
          <p className="text-gray-500">Shorten your long URLs instantly</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              onChange={(e) => {
                setOriginalUrl(e.target.value);
                setError("");
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              type="text"
              value={originalUrl}
              placeholder="https://example.com/your-long-url"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Shortening..." : "🔗 Shorten URL"}
          </button>

          {shortUrl && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">✅ Shortened URL</p>
                <div className="flex items-center gap-2">
                  <a
                    href={shortUrl.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 font-medium break-all flex-1 hover:underline"
                  >
                    {shortUrl.shortUrl}
                  </a>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-gray-200 rounded-lg text-sm"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {shortUrl.qrcodeImg && (
                <div className="text-center bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">📱 Scan QR Code</p>
                  <img
                    src={shortUrl.qrcodeImg}
                    alt="QR code"
                    className="mx-auto w-32 h-32"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;