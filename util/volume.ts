import { existsSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

interface StringMap {
  [key: string]: string;
}

/**
 * I made this project just to kill some time, speed and data resiliency isn't much of a concern.
 * This will be deployed using fly.io's volume disk, hence the `/data` path.
 */

const DIR = "/data";
const FILE = "kv.json";
const FULLPATH = join(DIR, FILE);
const CACHE: StringMap = {};

export function checkOrCreatePersistence(): void {
  if (!existsSync(DIR)) {
    console.error(`Cannot read persistent directory ${DIR}}.`);
    process.exit(1);
  }

  if (!existsSync(FULLPATH)) {
    writeFileSync(FULLPATH, "{}");
  }
}

export function getKey(key: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(CACHE, key)) {
    return CACHE[key];
  }

  const obj = readJSON();
  return obj[key];
}

export function putValue(key: string, value: string): void {
  const obj = readJSON();
  obj[key] = value;
  CACHE[key] = value;

  writeFileSync(FULLPATH, JSON.stringify(obj));
}

function readJSON(): StringMap {
  const raw = readFileSync(FULLPATH);
  return JSON.parse(raw.toString());
}

