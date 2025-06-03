"use strict";

const frame = document.getElementById("uv-frame");
const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const browserControls = document.getElementById("uv-browser-controls");

const siteIcon = document.getElementById("uv-site-icon");

const defaultSiteIcon = siteIcon.src;

siteIcon.addEventListener("error", () => {
    siteIcon.src = defaultSiteIcon;
});

address.oninput = async () => {
  let addinghttp = true;
  if (address.value.includes("http")) {
    addinghttp = false;
  }

  let searchValue = address.value;
  if (addinghttp) {
    searchValue = "https://" + searchValue;
  }

  try {
    let url = new URL(searchValue);
    url = `${url.protocol}//${url.host}/favicon.ico`;
    siteIcon.src = url;
  } catch(e) {
    siteIcon.src = defaultSiteIcon;
  }
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	frame.style.display = "block";
  browserControls.style.display = "flex";
	let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
	if (await connection.getTransport() !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}
	frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});

document.body.addEventListener("keydown", () => {
  if (document.activeElement != address) {
    address.focus();
    address.setSelectionRange(address.value.length, address.value.length);
  }
});

const homeButton = document.getElementById("uv-button-home");
const leftButton = document.getElementById("uv-button-left");
const rightButton = document.getElementById("uv-button-right");

let historyStack = [];
let historyIndex = 0;
let isTimetravel = false;

homeButton.addEventListener("click", function() {
  frame.style.display = "none"; 
  browserControls.style.display = "none";
  frame.src = "about:blank";
});

leftButton.addEventListener("click", function() {
  if (historyIndex <= 0) {
    return;
  }
  timeTravel(-1);
});
rightButton.addEventListener("click", function() {
  if (historyIndex >= historyStack.length) {
    return;
  }
  timeTravel(1);
});


function timeTravel(amount) {
  isTimetravel = true;
  historyIndex += amount;
  frame.src = historyStack[historyIndex];
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
      if (isTimetravel) {
        isTimetravel = false;
      } else {
        historyStack.push(frame.src);
        historyIndex++;
        // Incase the user presses the back arrow, but they were on the home screen. So we move the frame out of the way
        if (frame.src == "about:blank") {
          frame.style.display = "none";
        }
        browserControls.style.display = frame.style.display;
        if (browserControls.style.display == "block") {
          browserControls.style.display = "flex";
        }
      }
    }
  });
});

observer.observe(frame, {
    attributes: true
});
