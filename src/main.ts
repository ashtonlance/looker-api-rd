// Types for API response
interface EncryptedUrlResponse {
  encrypted_url?: {
    ciphertext: string;
    iv: string;
  };
}

async function decryptAesCbc(
  ciphertext: string,
  iv: string,
  keyString: string
): Promise<string> {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const keyHash = await window.crypto.subtle.digest(
    "SHA-256", 
    textEncoder.encode(keyString)
  );
  
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: ivBuffer
    },
    key,
    ciphertextBuffer
  );
  
  return textDecoder.decode(decrypted);
}

async function getEmbedUrl(raw_url: string, user_id: string): Promise<string | null> {
  const url = "https://mi9amhk8h1.execute-api.us-west-2.amazonaws.com/dev/data";
  const api_key = "2ac063bced74b0b831ab2914a10efbd1";
  const secret = "26fc82234b50518d801286998b182100";
  
  const data = {
    api_key,
    user_id,
    first_name: "test_first",
    last_name: "test_last",
    session_length: 30,
    raw_url
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const responseData: EncryptedUrlResponse = await response.json();

    if (responseData.encrypted_url) {
      const { ciphertext, iv } = responseData.encrypted_url;
      return await decryptAesCbc(ciphertext, iv, secret);
    } else {
      displayText("Error: No encrypted URL found in response");
      return null;
    }
    
  } catch (error) {
    displayText(`Error: ${error}`);
    return null;
  }
}

function displayText(text: string) {
  const div = document.createElement('div');
  div.style.margin = '10px';
  div.textContent = text;
  document.body.appendChild(div);
}

// Main execution
async function init() {
  const raw_url = "https://analyticsodyssey.cloud.looker.com/dashboards/1344?Date+Date=30+day";
  const user_id = "user123"; // This can be changed as needed
  
  displayText(`User ID: ${user_id}`);
  displayText(`Raw URL: ${raw_url}`);
  
  const embedUrl = await getEmbedUrl(raw_url, user_id);
  if (embedUrl) {
    displayText(`Embed URL: ${embedUrl}`);
  }
}

// Start the process when the page loads
document.addEventListener('DOMContentLoaded', init);

// Export for external use if needed
export { getEmbedUrl };