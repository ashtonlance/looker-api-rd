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
