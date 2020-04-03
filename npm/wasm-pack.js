/**
 * TODO: ~/.cargo/bin/wasm-pack should be checked first if exist use that
 */
import { Binary } from "./binary-class.js";
import os from "os";
import {join} from "path";

const getPlatform = () => {
  const type = os.type();
  const arch = os.arch();
  if (arch !== "x64") {
    throw new Error(`Unsupported arch only x64 is supported: ${type} ${arch}`);  
  }
  if (type === "Windows_NT") {
    return "x86_64-pc-windows-msvc";
  }
  if (type === "Linux") {
    return "x86_64-unknown-linux-musl";
  }
  if (type === "Darwin") {
    return "x86_64-apple-darwin";
  }

  throw new Error(`Unsupported platform: ${type} ${arch}`);
};

const platform = getPlatform();
//import {version} from "./package.json";
const version = "0.9.1"
const author = "rustwasm";
const name = "wasm-pack";
const url = `https://github.com/${author}/${name}/releases/download/v${version}/${name}-v${version}-${platform}.tar.gz`;
export const wasmPack = new Binary(url, { name });

