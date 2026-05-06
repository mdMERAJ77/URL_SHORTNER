import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    axios
      .post("http://localhost:3000/api/short", { originalUrl })
      .then((res) => {
        setShortUrl(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl?.shortUrl);
    alert("Copied!");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            URL Shortener
          </h1>
          <p className="text-gray-500">Shorten your long URLs instantly</p>
        </div>

        <div className="space-y-4">
          <input
            onChange={(e) => setOriginalUrl(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            type="text"
            placeholder="https://example.com/your-long-url"
            className="w-full px-4 py-3 border  rounded-lg "
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Shortening..." : "🔗 Shorten URL"}
          </button>

          {shortUrl && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">✅ Shortened URL</p>
                <div className="flex items-center gap-2">
                  <a
                    href={shortUrl?.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 font-medium break-all flex-1"
                  >
                    {shortUrl?.shortUrl}
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
