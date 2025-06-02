require("dotenv").config(); // Ensure dotenv is loaded if using environment variables

const axios = require("axios");
const { Readable } = require("stream");

/**
 * Suonora SDK for Text-to-Speech API.
 * Provides methods to convert text to speech, stream audio,
 * list available voices, and check account balance.
 */
class Suonora {
  /**
   * Creates an instance of the Suonora SDK.
   * @param {object} options - Configuration options for the SDK.
   * @param {string} options.apiKey - Your Suonora API key.
   * @param {string} [options.baseUrl='https://api.suonora.com/v1'] - The base URL for the Suonora API.
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.SUONORA_API_KEY;
    this.baseUrl = options.baseUrl || "https://api.suonora.com/v1";

    if (!this.apiKey) {
      throw new Error(
        "Suonora SDK: API key is required. Provide it during initialization or set SUONORA_API_KEY environment variable."
      );
    }

    // Main Axios client for API requests
    const client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // --- Nested 'audio' property for speech synthesis ---
    this.audio = {
      /**
       * Generates speech from text synchronously.
       * The audio response is returned as a complete Buffer.
       * This is suitable for shorter texts or when you need the full audio before playback.
       * Accessible via `suonora.audio.create()`.
       * @param {object} options - Options for speech synthesis.
       * @param {string} options.input - The text to be synthesized (max 5,000 characters).
       * @param {string} options.model - The synthesis model name (e.g., 'legacy-v2.5', 'sonic-speed').
       * @param {string} options.voice - The voice ID (e.g., 'axel', 'jennifer').
       * @param {string} [options.pitch] - Pitch adjustment (e.g., '-50%', '+20%').
       * @param {string} [options.style] - Emotional speaking style (e.g., 'neutral', 'cheerful', 'angry').
       * @param {number} [options.styleDegree] - Intensity of the selected style (0.5 to 2.0).
       * @param {string} [options.lang] - BCP-47 language code (e.g., 'fr-FR', 'ja-JP').
       * @returns {Promise<Buffer>} A Promise that resolves with the audio data as a Buffer.
       * @throws {Error} If the input is invalid or the API call fails.
       */
      create: async (options) => {
        const { input, model, voice, ...speechOptions } = options;

        // Basic input validation
        if (!input || typeof input !== "string" || input.length === 0) {
          throw new Error(
            "Suonora SDK: Input text is required and must be a non-empty string for audio.create."
          );
        }
        if (input.length > 5000) {
          throw new Error(
            "Suonora SDK: Input text exceeds the 5,000 character limit."
          );
        }
        if (!model || typeof model !== "string") {
          throw new Error(
            'Suonora SDK: "model" is a required string in options for audio.create.'
          );
        }
        if (!voice || typeof voice !== "string") {
          throw new Error(
            'Suonora SDK: "voice" is a required string in options for audio.create.'
          );
        }

        // Build the payload
        const payload = {
          input,
          model,
          voice,
          // Optional parameters are included only if they exist
          ...(speechOptions.pitch && { pitch: speechOptions.pitch }),
          ...(speechOptions.style && { style: speechOptions.style }),
          ...(speechOptions.styleDegree && {
            styleDegree: speechOptions.styleDegree,
          }),
          ...(speechOptions.lang && { lang: speechOptions.lang }),
        };

        try {
          const response = await client.post("/audio/speech", payload, {
            // Use the main client
            responseType: "arraybuffer", // Get raw binary data as a Node.js Buffer
            headers: {
              Accept: "audio/mpeg", // We expect MP3 audio as per docs
            },
          });
          return Buffer.from(response.data);
        } catch (error) {
          const apiErrorMessage = error.response
            ? `HTTP ${error.response.status}: ${JSON.stringify(
                error.response.data
              )}`
            : `Network or request setup error: ${error.message}`;
          console.error(`Suonora SDK Error (audio.create): ${apiErrorMessage}`);
          throw new Error(`Failed to generate speech: ${apiErrorMessage}`);
        }
      },

      /**
       * Generates speech from text as a stream.
       * Audio frames begin sending as soon as synthesis starts,
       * enabling immediate playback for real-time applications.
       * Accessible via `suonora.audio.stream()`.
       * @param {object} options - Options for streaming synthesis.
       * @param {string} options.input - The text to be synthesized (max 5,000 characters).
       * @param {string} options.model - The synthesis model name.
       * @param {string} options.voice - The voice ID.
       * @param {string} [options.pitch] - Pitch adjustment.
       * @param {string} [options.style] - Emotional speaking style.
       * @param {number} [options.styleDegree] - Intensity of the selected style.
       * @param {string} [options.lang] - BCP-47 language code.
       * @returns {Promise<Readable>} A Promise that resolves with a Readable stream of the audio data.
       * @throws {Error} If the input is invalid or the API call fails.
       */
      stream: async (options) => {
        const { input, model, voice, ...speechOptions } = options;

        // Basic input validation
        if (!input || typeof input !== "string" || input.length === 0) {
          throw new Error(
            "Suonora SDK: Input text is required and must be a non-empty string for audio.stream."
          );
        }
        if (input.length > 5000) {
          throw new Error(
            "Suonora SDK: Input text exceeds the 5,000 character limit."
          );
        }
        if (!model || typeof model !== "string") {
          throw new Error(
            'Suonora SDK: "model" is a required string in options for audio.stream.'
          );
        }
        if (!voice || typeof voice !== "string") {
          throw new Error(
            'Suonora SDK: "voice" is a required string in options for audio.stream.'
          );
        }

        const payload = {
          input,
          model,
          voice,
          // Optional parameters are included only if they exist
          ...(speechOptions.pitch && { pitch: speechOptions.pitch }),
          ...(speechOptions.style && { style: speechOptions.style }),
          ...(speechOptions.styleDegree && {
            styleDegree: speechOptions.styleDegree,
          }),
          ...(speechOptions.lang && { lang: speechOptions.lang }),
        };

        try {
          const response = await client.post("/audio/stream", payload, {
            // Use the main client
            responseType: "stream", // Get a Readable stream for real-time processing
            headers: {
              Accept: "audio/mpeg", // We expect MP3 audio stream
            },
          });
          return response.data; // This is the Readable stream from Axios
        } catch (error) {
          const apiErrorMessage = error.response
            ? `HTTP ${error.response.status}: ${JSON.stringify(
                error.response.data
              )}`
            : `Network or request setup error: ${error.message}`;
          console.error(`Suonora SDK Error (audio.stream): ${apiErrorMessage}`);
          throw new Error(`Failed to stream speech: ${apiErrorMessage}`);
        }
      },
    }; // End of this.audio object

    // --- Other top-level methods ---

    /**
     * Retrieves a list of available voices from Suonora.
     * @returns {Promise<Array<object>>} A Promise that resolves with an array of voice objects.
     * @throws {Error} If the API call fails.
     */
    this.listVoices = async (filters) => {
      try {
        const response = await client.get("/voices/list");
        if (response.data && Array.isArray(response.data.voices)) {
          return response.data.voices;
        }
        throw new Error(
          "Suonora SDK: Unexpected response format for listVoices."
        );
      } catch (error) {
        const apiErrorMessage = error.response
          ? `HTTP ${error.response.status}: ${JSON.stringify(
              error.response.data
            )}`
          : `Network or request setup error: ${error.message}`;
        console.error(`Suonora SDK Error (listVoices): ${apiErrorMessage}`);
        throw new Error(`Failed to list voices: ${apiErrorMessage}`);
      }
    };

    /**
     * Retrieves the current usage balance for your Suonora account.
     * This includes total, used, remaining, and overage characters.
     * @returns {Promise<object>} A Promise that resolves with a balance object.
     * The object contains: `total_credits`, `used_credits`, `remaining_credits`,
     * `overage_characters`, `overage_amount_usd`.
     * @throws {Error} If the API call fails.
     */
    this.getBalance = async () => {
      try {
        const response = await client.get("/balance"); 
        if (response.data && typeof response.data.balance === "object") {
          return response.data.balance;
        }
        throw new Error(
          "Suonora SDK: Unexpected response format for getBalance."
        );
      } catch (error) {
        const apiErrorMessage = error.response
          ? `HTTP ${error.response.status}: ${JSON.stringify(
              error.response.data
            )}`
          : `Network or request setup error: ${error.message}`;
        console.error(`Suonora SDK Error (getBalance): ${apiErrorMessage}`);
        throw new Error(`Failed to get balance: ${apiErrorMessage}`);
      }
    };
  } 
}

module.exports = Suonora;
