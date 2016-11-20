import * as fs from "fs";
import * as _ from "lodash";
import * as chokidar from "chokidar";
import * as mkdirp from "mkdirp";
import * as glob from "glob";
import * as path from "path";
import * as rimraf from "rimraf";
import * as waitForChange from "wait-for-change";
import {CopyConfig} from "./config/config.interface";

export {waitForChange};

export function getFiles(src: string | string[], options: glob.IOptions = {}) {
  const sources: string[] = _.isString(src) ? [src] : src;
  return Promise.all(sources.map(source => new Promise<string[]>((resolve, reject) =>
    glob(source, options, (e, files) =>
      e ? reject(e) : resolve(files)))))
    .then(files =>
      _.chain(files)
        .flatten()
        .uniq()
        .reject((f: string) => _.includes(f, "*"))
        .value() as string[]);
}

export function readFile(src: string) {
  return new Promise<string>((resolve, reject) =>
    fs.readFile(src, "utf-8", (e, content) =>
      e ? reject(e) : resolve(content)));
}
export function writeFile(dest: string, content: string, options: any = {}) {
  return new Promise<string>((resolve, reject) =>
    mkdirp(path.dirname(dest), err =>
      err ? reject(err) : fs.writeFile(dest, content, options, e =>
        e ? reject(e) : resolve(dest))));
}
export function watch(pattern: string,
                      onChange: (files: string[]) => any,
                      opts: any = {debounce: 100, events: ["change"]}) {
  const watcher = chokidar.watch(pattern, opts);
  const files: string[] = [];
  const debouncedCallback = _.debounce(() => {
    onChange(files);
    files.length = 0;
  }, opts.debounce || 100);

  for (let event of opts.events || ["change"]) {
    watcher.on(event, file => {
      files.push(file);
      debouncedCallback();
    });
  }
  return watcher;
}

export function del(file: string | string[]) {
  const files = _.isArray(file) ? file : [file];
  return Promise.all(files.map(f =>
    new Promise((resolve, reject) =>
      rimraf(f, e => e ? reject(e) : resolve()))));
}

export function copy(config: CopyConfig | CopyConfig[]) {
  if (!config) {
    return Promise.resolve([]);
  }
  const configs = _.isArray(config) ? config : [config];
  return Promise.all(configs.map(conf =>
    getFiles(conf.src, {cwd: conf.cwd || ""})
      .then(files =>
        Promise.all(files.map(file =>
          readFile(`${conf.cwd ? `${conf.cwd}/` : ""}${file}`)
            .then(content =>
              writeFile(`${conf.dest}/${file}`, content)))))));
}

export default {
  getFiles,
  readFile,
  writeFile,
  watch
};
