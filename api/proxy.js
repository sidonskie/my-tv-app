// api/proxy.js

// This function will run on Vercel's servers, not in the browser.
export default async function handler(request, response) {
  try {
    // Get the stream URL from the query parameter
    const streamUrl = request.query.url;

    if (!streamUrl) {
      return response.status(400).send("Error: 'url' query parameter is required.");
    }

    // We are adding a 'User-Agent' header to identify ourselves as VLC Media Player.
    // This can bypass servers that block generic or browser-based requests.
    const customHeaders = {
      'User-Agent': 'VLC/3.0.20 (x86_64/Windows)',
      'Referer': streamUrl // Sometimes a referer is also checked.
    };

    // Fetch the stream from the source server using the custom headers
    const streamResponse = await fetch(streamUrl, { headers: customHeaders });

    // Check if the stream's server responded with an error (e.g., 403 Forbidden)
    if (!streamResponse.ok) {
        return response.status(streamResponse.status).send(`Stream server responded with: ${streamResponse.statusText}`);
    }

    // Set the necessary CORS headers to allow your web page to access the stream
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    
    // Copy all headers from the original stream response (like content type)
    streamResponse.headers.forEach((value, key) => {
        // Vercel handles chunked encoding, so we can skip this header
        if (key.toLowerCase() !== 'transfer-encoding') {
            response.setHeader(key, value);
        }
    });

    // Pipe the video stream data directly back to the browser
    return streamResponse.body.pipe(response);

  } catch (error) {
    console.error("Proxy Error:", error);
    return response.status(500).send(`Server Error: ${error.message}`);
  }
}
