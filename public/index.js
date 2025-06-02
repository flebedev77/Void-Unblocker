"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js")

const siteIcon = document.getElementById("uv-site-icon");

siteIcon.addEventListener("error", () => {
    url = new URL(searchEngine.value);
    url = `${url.protocol}//${url.host}/favicon.ico`;
    siteIcon.src = url;
});

address.oninput = async () => {
  let url;
  let addinghttp = true;
  if (address.value.includes("http")) {
    addinghttp = false;
  }

  let searchValue = address.value;
  if (addinghttp) {
    searchValue = "https://" + searchValue;
  }

  try {
    url = new URL(searchValue);
    url = `${url.protocol}//${url.host}/favicon.ico`;
    siteIcon.src = url;
  } catch(e) {
    url = new URL(searchEngine.value);
    url = `${url.protocol}//${url.host}/favicon.ico`;
    siteIcon.src = url;
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

	let frame = document.getElementById("uv-frame");
	frame.style.display = "block";
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
