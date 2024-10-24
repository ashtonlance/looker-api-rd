import cors from "cors";
import crypto from "crypto";
import express, { Request, Response } from "express";

// Types for API responses and requests
interface EncryptedUrlResponse {
  encrypted_url?: {
    ciphertext: string;
    iv: string;
  };
}

interface EmbedUrlRequest {
  raw_url: string;
  user_id: string;
}

function decryptAesCbc(
  ciphertext: string,
  iv: string,
  keyString: string
): string {
  // Create key using SHA-256
  const key = crypto.createHash("sha256").update(keyString).digest();

  // Decode base64 strings
  const decodedCiphertext = Buffer.from(ciphertext, "base64");
  const decodedIv = Buffer.from(iv, "base64");

  // Create decipher
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, decodedIv);

  // Decrypt
  let decrypted = decipher.update(decodedCiphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

async function getEmbedUrl(
  raw_url: string,
  user_id: string
): Promise<string | null> {
  const url = "https://mi9amhk8h1.execute-api.us-west-2.amazonaws.com/dev/data";
  const api_key = process.env.VITE_API_KEY || ""; // Replace with environment variable
  const secret = process.env.VITE_SECRET || ""; // Replace with environment variable

  const data = {
    api_key,
    user_id,
    first_name: "test_first",
    last_name: "test_last",
    session_length: 30,
    raw_url,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = (await response.json()) as EncryptedUrlResponse;

    if (responseData.encrypted_url) {
      const { ciphertext, iv } = responseData.encrypted_url;
      return decryptAesCbc(ciphertext, iv, secret);
    } else {
      console.error("No encrypted URL found in response");
      return null;
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Set up Express server
const app = express();
app.use(cors()); // Allow connections from localhost without any CORS rules
app.use(express.json());

// Endpoint to get embed URL
app.post(
  "/get-embed-url",
  // @ts-ignore
  async (req: Request<{}, {}, EmbedUrlRequest>, res: Response) => {
    const { raw_url, user_id } = req.body;

    if (!raw_url || !user_id) {
      return res.status(400).json({ error: "Missing raw_url or user_id" });
    }

    try {
      const embedUrl = await getEmbedUrl(raw_url, user_id);
      if (embedUrl) {
        res.json({ embedUrl });
      } else {
        res.status(500).json({ error: "Failed to generate embed URL" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
