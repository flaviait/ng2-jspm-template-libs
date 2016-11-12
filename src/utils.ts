import * as fs from "fs";
import * as _ from "lodash";
import * as chokidar from "chokidar";
import * as mkdirp from "mkdirp";
import * as glob from "glob";
import * as path from "path";

export function getFiles(src: string, options: glob.IOptions = {}) {
  return new Promise<string[]>((resolve, reject) =>
    glob(src, options, (e, files) =>
      e ? reject(e) : resolve(files)))
    .then(files => _.reject(files, f => _.includes(f, "*")));
}

export function readFile(src: string) {
  return new Promise<string>((resolve, reject) =>
    fs.readFile(src, "utf-8", (e, content) =>
      e ? reject(e) : resolve(content)));
}
export function writeFile(dest: string, content: string, options: any = {}) {
  return new Promise<void>((resolve, reject) =>
    mkdirp(path.dirname(dest), err =>
      err ? reject(err) : fs.writeFile(dest, content, options, e =>
        e ? reject(e) : resolve())));
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

export function waitForChange(file: string) {
  return new Promise<void>((resolve) => {
    const watcher = watch(file, () => {
      watcher.close();
      resolve();
    }, {events: ["change", "add"]});
  });
}

export default {
  getFiles,
  readFile,
  writeFile,
  watch
};
