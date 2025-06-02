# Suonora Node.js SDK

[](https://www.google.com/search?q=https://www.npmjs.com/package/suonora)
[](https://opensource.org/licenses/MIT)

A Node.js library for interacting with the **Suonora Text-to-Speech (TTS) API**. This SDK provides methods to:

  * Convert text into audio.
  * Stream audio responses.
  * Get a list of available voices.
  * Check account usage.

-----

## Installation

Add the Suonora SDK to your project:

```bash
npm install suonora-sdk axios
```

**Note:** `axios` is used internally by the SDK for HTTP requests. Install it if your project doesn't already include it.

-----

## Authentication

All requests to the Suonora API require an API key.

1.  **Get Your API Key:** Obtain your API key from your [Suonora account dashboard](https://suonora.com/play/api).
2.  **Provide the API Key:**
      * **Environment Variable (Recommended):** Set the `SUONORA_API_KEY` environment variable in your system or through a `.env` file loaded by `dotenv`. This keeps your key out of your code.
        ```bash
        # Example for .env file or terminal
        SUONORA_API_KEY="your_actual_api_key_here"
        ```
      * **Directly in Code:** Pass the `apiKey` option when creating a `Suonora` instance.
        ```javascript
        const suonora = new Suonora({ apiKey: 'your_actual_api_key_here' });
        ```

-----

## Usage

### Initialize the SDK

Start by importing the `Suonora` class:

```javascript
const Suonora = require('suonora');

// Initialize. The SDK will use process.env.SUONORA_API_KEY by default.
const suonora = new Suonora();

// Or, pass the API key explicitly:
// const suonora = new Suonora({ apiKey: 'YOUR_API_KEY' });
```

### Audio Operations (`suonora.audio`)

These methods handle text-to-speech conversion.

#### Generate Speech (Synchronous)

Uses `suonora.audio.create` to get the complete audio as a Node.js `Buffer`. Best for shorter texts or when you need the full audio before processing.

```javascript
const fs = require('fs');
const path = require('path');

async function generateAudio() {
  try {
    const audioBuffer = await suonora.audio.create({
      input: "This text will be converted to speech.",
      model: 'legacy-v2.5', // Required model name
      voice: 'axel',        // Required voice ID
      lang: 'en-US',        // Optional: BCP-47 language code
      pitch: '+5%',         // Optional: Pitch adjustment (e.g., '-100%' to '+100%')
      style: 'calm',        // Optional: Speaking style (e.g., 'neutral', 'cheerful')
      styleDegree: 1.0      // Optional: Style intensity (0.5 to 2.0)
    });

    const filename = path.join(__dirname, 'output_sync.mp3');
    fs.writeFileSync(filename, audioBuffer);
    console.log(`Audio saved to ${filename} (${audioBuffer.length} bytes)`);
  } catch (error) {
    console.error('Error generating speech:', error.message);
  }
}

generateAudio();
```

#### Stream Speech (Asynchronous)

Uses `suonora.audio.stream` to get a Node.js `Readable` stream of the audio. Useful for real-time playback or processing very long texts.

```javascript
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises'); // Requires Node.js v15+

async function streamAudio() {
  try {
    const audioStream = await suonora.audio.stream({
      input: "This is a longer piece of text that will be streamed as it's generated.",
      model: 'legacy-v2.5',
      voice: 'axel',
      lang: 'en-US'
    });

    const filename = path.join(__dirname, 'output_stream.mp3');
    const fileWriteStream = fs.createWriteStream(filename);

    // Pipe the incoming audio stream to a file
    await pipeline(audioStream, fileWriteStream);
    console.log(`Audio streamed to ${filename}`);
  } catch (error) {
    console.error('Error streaming speech:', error.message);
  }
}

streamAudio();
```

### List Available Voices (`suonora.listVoices`)

Fetches a list of all voices available on the Suonora API. You can filter the list.

```javascript
async function getVoices() {
  try {
    // Get all available voices
    const allVoices = await suonora.listVoices();
    console.log(`Total voices: ${allVoices.length}`);

    // Filter voices by language and model
    const filteredVoices = await suonora.listVoices({
      language: 'en-US',
      model: 'legacy-v2.5'
    });
    console.log(`English (US) voices from 'legacy-v2.5' model: ${filteredVoices.length}`);
    
    // Log details for the first few voices
    filteredVoices.slice(0, 3).forEach((voice, index) => {
      console.log(`  Voice ${index + 1}: ID=${voice.id}, Name=${voice.name}, Gender=${voice.gender}, Model=${voice.model}`);
    });

  } catch (error) {
    console.error('Error getting voices:', error.message);
  }
}

getVoices();
```

### Check Account Balance (`suonora.getBalance`)

Retrieves your current Suonora API usage, including total, used, and remaining characters.

```javascript
async function getAccountBalance() {
  try {
    const balance = await suonora.getBalance();
    console.log('--- Suonora Account Balance ---');
    console.log(`Total Characters: ${balance.total_credits}`);
    console.log(`Used Characters: ${balance.used_credits}`);
    console.log(`Remaining Characters: ${balance.remaining_credits}`);
    if (balance.overage_characters > 0) {
      console.log(`Overage: ${balance.overage_characters} characters, estimated $${balance.overage_amount_usd.toFixed(2)}`);
    }
  } catch (error) {
    console.error('Error getting balance:', error.message);
  }
}

getAccountBalance();
```

-----

## Error Handling

SDK methods throw standard JavaScript `Error` objects on failure. These errors contain a message detailing the issue, often including the HTTP status code and API error response if available.

Always use `try...catch` blocks to handle potential errors when calling SDK methods.

Common HTTP status codes from the Suonora API:

  * **400 Bad Request:** Request body or parameters are invalid.
  * **401 Unauthorized:** API key is missing or invalid.
  * **404 Not Found:** The requested API endpoint does not exist.
  * **429 Too Many Requests:** API rate limits have been exceeded.
  * **500 Internal Server Error:** An unexpected server error occurred on Suonora's end.

-----

## Contributing

For issues, feature requests, or contributions, please use the project's [GitHub repository](https://github.com/zecod/suonora-sdk.git).

-----

## License

This project is licensed under the MIT License. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for full details.

-----