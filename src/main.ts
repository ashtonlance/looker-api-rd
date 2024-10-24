const secret = import.meta.env.VITE_SECRET;

async function decryptAesCbc(
  ciphertext: string,
  iv: string,
  keyString: string
): Promise<string> {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c =>
    c.charCodeAt(0)
  );
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
      iv: ivBuffer,
    },
    key,
    ciphertextBuffer
  );

  return textDecoder.decode(decrypted);
}

function displayText(text: string) {
  const div = document.createElement("div");
  div.style.margin = "10px";
  div.textContent = text;
  document.body.appendChild(div);
}

// Main execution
async function init() {
  const raw_url =
    "https://analyticsodyssey.cloud.looker.com/dashboards/1344?Date+Date=30+day";
  const user_id = "1159";

  try {
    const response = await fetch("http://localhost:3000/get-embed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw_url, user_id }),
    });

    const responseData = await response.json();
    console.log(responseData, "responseData");
    displayEmbedUrl(responseData.embedUrl);
    if (responseData) {
      const responseObject = JSON.parse(responseData.embedUrl);
      console.log(responseObject, "responseObject");
      const { ciphertext, iv, nonce } = responseObject;
      console.log(nonce, "nonce");
      const embedUrl = await decryptAesCbc(ciphertext, iv, secret);
      displayEmbedUrl(embedUrl);
    } else {
      displayText("Error: No encrypted URL found in response");
    }
  } catch (error) {
    displayText(`Error: ${error}`);
  }
}

// New function to display the embed URL in an iframe
function displayEmbedUrl(url: string) {
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.width = "100%"; // Set desired width
  iframe.style.height = "600px"; // Set desired height
  iframe.style.border = "none"; // Optional: remove border
  document.body.appendChild(iframe);
}

// Start the process when the page loads
document.addEventListener("DOMContentLoaded", init);
