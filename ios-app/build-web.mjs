// Builds the iOS web bundle from the website in the repository root.
// ../index.html (the same file Netlify publishes) → www/index.html, with React, htm and
// Supabase loaded from files inside the app instead of the internet (faster start, works on weak connections).
// Usage: node build-web.mjs   (run inside ios-app/ after npm install)
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const here = import.meta.dirname;
const root = resolve(here, "..");
const out = resolve(here, "www");
const fail = msg => { console.error("build-web: " + msg); process.exit(1); };

let html = await readFile(resolve(root, "index.html"), "utf8");

const vendor = [
  ["https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js", "node_modules/react/umd/react.production.min.js", "react.js"],
  ["https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js", "node_modules/react-dom/umd/react-dom.production.min.js", "react-dom.js"],
  ["https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js", "node_modules/htm/dist/htm.umd.js", "htm.js"],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js", "node_modules/@supabase/supabase-js/dist/umd/supabase.js", "supabase.js"]
];

await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, "vendor"), { recursive: true });
for (const [url, file, name] of vendor) {
  if (!html.includes(url)) fail("script not found in index.html: " + url);
  html = html.split(url).join("vendor/" + name);
  await copyFile(resolve(here, file), resolve(out, "vendor", name));
}

// No service worker inside the app (the app already has its files).
html = html.replace(/<script>if\('serviceWorker'[^<]*<\/script>/, "");
// Web-only links that make no sense inside the app.
html = html.replace(/<link rel="manifest"[^>]*>/, "");

if (!html.includes("IOS_APP")) fail("index.html has no iOS app mode (v20 layer missing)");
await writeFile(resolve(out, "index.html"), html);
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "og-image.png"]) {
  try { await copyFile(resolve(root, f), resolve(out, f)); } catch {}
}
console.log("build-web: www/index.html written (" + html.length + " chars)");
