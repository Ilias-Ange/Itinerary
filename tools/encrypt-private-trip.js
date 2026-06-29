#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const vm = require("vm");
const { stdin, stdout } = require("process");
const crypto = require("crypto").webcrypto;

const encoder = new TextEncoder();

function base64FromBytes(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function loadTripSource(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const sandbox = {
    exports: {},
    module: { exports: {} },
    window: {}
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: sourcePath });

  if (sandbox.window.PRIVATE_TRIP_SOURCE) {
    return sandbox.window.PRIVATE_TRIP_SOURCE;
  }

  if (sandbox.exports.default) {
    return sandbox.exports.default;
  }

  if (Object.keys(sandbox.module.exports).length > 0) {
    return sandbox.module.exports;
  }

  return undefined;
}

function validateTrip(trip) {
  if (!trip || typeof trip !== "object") {
    throw new Error("Trip source must export an object.");
  }

  if (!Array.isArray(trip.days)) {
    throw new Error("Trip source must have a days array.");
  }

  trip.days.forEach((day, dayIndex) => {
    if (!Array.isArray(day.plans)) {
      throw new Error(`days[${dayIndex}].plans must be an array.`);
    }
  });
}

async function askPassphrase() {
  if (process.env.TRIP_PASSPHRASE) {
    return process.env.TRIP_PASSPHRASE;
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return await rl.question("Passphrase: ");
  } finally {
    rl.close();
  }
}

async function encryptTrip(trip, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 60000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(trip))
  );

  return {
    version: 1,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 60000,
      salt: base64FromBytes(salt)
    },
    cipher: {
      name: "AES-GCM",
      iv: base64FromBytes(iv)
    },
    data: base64FromBytes(new Uint8Array(encrypted))
  };
}

function writePayload(outputPath, payload) {
  const body = `window.PRIVATE_TRIP_PAYLOAD = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(outputPath, body, "utf8");
}

function bumpScheduleCache(htmlPath) {
  if (!fs.existsSync(htmlPath)) {
    return null;
  }

  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const html = fs.readFileSync(htmlPath, "utf8");
  const nextHtml = html.replace(
    /data\/private-trip\.enc\.js\?v=[^"]+/,
    `data/private-trip.enc.js?v=itinerary-${stamp}`
  );

  if (nextHtml !== html) {
    fs.writeFileSync(htmlPath, nextHtml, "utf8");
  }

  return stamp;
}

async function main() {
  const sourcePath = path.resolve(process.cwd(), process.argv[2] || "data/private-trip.local.js");
  const outputPath = path.resolve(process.cwd(), "data/private-trip.enc.js");
  const htmlPath = path.resolve(process.cwd(), "schedule.html");
  const trip = loadTripSource(sourcePath);
  const passphrase = process.argv[3] || await askPassphrase();

  validateTrip(trip);
  const payload = await encryptTrip(trip, passphrase);
  writePayload(outputPath, payload);
  const cacheStamp = bumpScheduleCache(htmlPath);

  console.log(`Encrypted ${sourcePath}`);
  console.log(`Wrote ${outputPath}`);
  if (cacheStamp) {
    console.log(`Updated schedule cache key: itinerary-${cacheStamp}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
