import {existsSync} from "fs";
import {homedir} from "os";
import {join} from "path";
import {spawnSync} from "child_process";
import mkdirp from "mkdirp";
import axios from "axios";
import tar from "tar";
import rimraf from "rimraf";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const error = msg => {
  console.error(msg);
  process.exit(1);
};

/** 
 * @typedef {object} BinaryConfig
 * @property {string} [name]
 * @property {string} [installDirectory]
 */

export class Binary {
  /**
   * 
   * @param {string} url 
   * @param {BinaryConfig} BinaryConfig 
   */
  constructor(url, { name, installDirectory }) {
    const errors = [];
    if (typeof url !== "string") {
      errors.push("url must be a string");
    } else {
      try {
        new URL(url);
      } catch (e) {
        errors.push(e);
      }
    }

    if (name && typeof name !== "string") {
      errors.push("name must be a string");
    }
    if (installDirectory && typeof installDirectory !== "string") {
      errors.push("installDirectory must be a string");
    }
    if (!installDirectory && !name) {
      errors.push("You must specify either name or installDirectory");
    }
    if (errors.length > 0) {
      let errorMsg = "Your Binary constructor is invalid:";
      errors.forEach(error => {
        errorMsg += error;
      });
      error(errorMsg);
    }

    this.url = url;
    this.name = name || "Your package";
    this.installDirectory = installDirectory || __dirname;
    if (!existsSync(this.installDirectory)) {
      mkdirp.sync(this.installDirectory);
    }
    
    this.binaryDirectory = join(this.installDirectory, "bin");
    this.binaryPath = join(this.binaryDirectory, name);

  }

  install() {
    const { binaryDirectory, installDirectory, binaryPath, name } = this;
    console.log({ binaryDirectory, installDirectory, binaryPath, name })
    
    //Flush existing install
    if (existsSync(this.binaryDirectory)) {
      rimraf.sync(this.binaryDirectory);
    }

    mkdirp.sync(this.binaryDirectory);

    console.log(`Downloading release from ${this.url}`);
    //TODO: curl -s http://example.com/file.tgz | tar xvf - -C dest/
    return axios({ url: this.url, responseType: "stream" })
      .then(({data}) => {
        data.pipe(tar.x({ strip: 1, C: this.binaryDirectory }));
      })
      .then(() => {
        console.log(
          `${this.name} has been installed!`
        );
      })
      .catch(({message}) => {
        error(`Error fetching release: ${message}`);
      });
  }

  uninstall() {
    if (!existsSync(this.binaryDirectory)) {
      error(`You have not installed ${name ? name : "this package"}`);
    }
    //TODO: deleting install directory is probally not the right way :)
    if (existsSync(this.installDirectory)) {
      rimraf.sync(this.installDirectory);
      console.log(
        `${this.name} has been uninstalled`
      );
    }
  }

  run() {
    //TODO: Running a binary via npm or node_modules/bin is maybe more clever
    const binaryPath = this.binaryPath;
    const [, , ...args] = process.argv;

    const options = { cwd: process.cwd(), stdio: "inherit" };

    // @ts-ignore
    const result = spawnSync(binaryPath, args, options);

    if (result.error) {
      error(result.error);
    }

    process.exit(result.status);
  }
}

export default Binary;
