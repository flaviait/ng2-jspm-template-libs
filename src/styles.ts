import * as fs from "fs";
import * as path from "path";
import {EventEmitter} from "events";

import * as _ from "lodash";
import * as sass from "node-sass";
import * as postcss from "postcss";
import * as styleLint from "stylelint";
import * as log4js from "log4js";
import * as sassGraph from "sass-graph";
import * as chokidar from "chokidar";

import {StylesCompileConfig, StylesLintingConfig} from "./config/config.interface";
import utils from "./utils";

export class StyleCompiler extends EventEmitter {

  private logger: log4js.Logger = log4js.getLogger("compile-styles");
  private watcher: fs.FSWatcher;
  private entryWatchers: {[file: string]: fs.FSWatcher} = {};
  private relativePath: string = this.config.cwd || "";

  constructor(private config: StylesCompileConfig) {
    super();
  }

  start() {
    if (this.config.watch) {
      this.watcher = chokidar.watch(this.config.entry as string[], _.pick(this.config, ["cwd"]))
        .on("unlink", (entry: string) => {
          this.entryWatchers[entry].close();
          this.emit("unwatch", entry);
        })
        .on("add", (entry: string) => {
          this.watchForChanges(entry);
          this.run(entry);
          this.emit("watch", entry);
        });
    } else {
      this.run(this.config.entry);
    }

    return this;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    _.each(this.entryWatchers, watcher => watcher.close());
  }

  private watchForChanges(entry: string) {
    let filesToWatch = this.getFilesToWatch(entry);
    const watcher = utils.watch(filesToWatch, () => {
      this.run(entry);
      const newFilesToWatch = this.getFilesToWatch(entry);
      const addedDeps = _.without(newFilesToWatch, ...filesToWatch);
      const removedDeps = _.without(filesToWatch, ...newFilesToWatch);
      _.each(addedDeps, file => watcher.add(file));
      _.each(removedDeps, file => watcher.unwatch(file));
      filesToWatch = newFilesToWatch;
    }, _.pick(this.config, ["cwd"]));
    this.entryWatchers[entry] = watcher;
  }

  private getFilesToWatch(entry: string) {
    return _.keys(sassGraph.parseFile(path.join(this.relativePath, entry), {
      extensions: ["sass", "scss", "css"]
    }).index);
  }

  private run(entries: string | string[]) {
    utils.getFiles(entries, _.pick(this.config, ["cwd"]))
      .then(entryFiles => {
        entryFiles.forEach(entryFile => {
          this.compile(entryFile)
            .then(
              () => this.emit("success"),
              (err) => {
                this.logger.error("Error processing styles:", err);
                this.emit("error", err);
              });
        });
      });

    return this;
  }

  private preprocess(file: string) {
    const sourceMapOptions = this.config.sourceMaps ? {
      sourceMapEmbed: true,
      sourceMapContents: true,
    } : {};
    return new Promise((resolve, reject) =>
      sass.render(_.assign({file: file}, this.config.sass, sourceMapOptions), (error, result) => {
        if (error) {
          error.message = `${error.line}:${error.column} ${error.message}`;
          reject(error);
        } else {
          resolve(result);
        }
      }));
  }

  private postprocess(output: string, processed: any) {
    return new Promise((resolve, reject) => {
      postcss((this.config.postcss || []).map(([pluginName, pluginConfig]) => {
        const plugin = require(pluginName);
        if (_.isFunction(pluginConfig)) {
          return plugin(pluginConfig);
        }
        return plugin;
      }))
        .process(processed.css, {
          map: this.config.sourceMaps && {inline: false},
          to: output
        })
        .then(
          (result: any) => resolve(result),
          reject
        );
    });
  }

  private write(output: string, processed: any) {
    const content = this.config.asESModule ? `export default \`${processed.css}\`;` : processed.css;
    return Promise.all(
      [utils.writeFile(output, content)]
        .concat(this.config.sourceMaps ? [utils.writeFile(`${output}.map`, processed.map)] : []));
  }

  private compile(entry: string) {
    const outputFile = this.config.output
      || path.join(this.config.outDir, entry.replace(/\.(s[ac]ss)$/, this.config.asESModule ? ".$1.js" : ".css"));
    const entryFile = path.join(this.relativePath, entry);
    return this.preprocess(entryFile)
      .then((processed) => this.postprocess(outputFile, processed))
      .then((processed) => this.write(outputFile, processed))
      .then(() => this.logger.debug(`Compiled ${entryFile} to ${outputFile}`));
  }
}

export class StyleLinter extends EventEmitter {

  private lintingConfiguration = JSON.parse(fs.readFileSync(".stylelintrc", "utf8"));
  private lintingErrors: {[file: string]: any} = {};
  private logger: log4js.Logger = log4js.getLogger("lint-styles");

  constructor(private config: StylesLintingConfig) {
    super();
  }

  start = () => {
    utils.getFiles(this.config.files).then(this.run);
    if (this.config.watch) {
      utils.watch(this.config.files, this.run);
    }

    return this;
  };

  run = (files: string[]) => {
    this.lint(files)
      .then(
        () => {
          this.logger.debug("No linting errors");
          this.emit("success");
        },
        (err) => {
          if (err.code === "ELINT") {
            this.logger.error(`There are ${err.count} linting errors:` + "\n" + err.output);
          } else {
            this.logger.error(err.stack);
          }
          this.emit("error", err);
        }
      );

    return this;
  };

  private lint = (files: string[]) => {
    return Promise
      .all(files.map(file => utils.readFile(file).then(content => ({file, content}))))
      .then(fileObjs =>
        Promise.all(fileObjs.map(fileObj =>
          styleLint.lint({
            codeFilename: fileObj.file,
            code: fileObj.content,
            config: this.lintingConfiguration
          }).then((result: any) => {
            if (result.errored) {
              this.lintingErrors[fileObj.file] = result;
            } else {
              delete this.lintingErrors[fileObj.file];
            }
          })))
          .then(() => {
            if (Object.keys(this.lintingErrors).length > 0) {
              const err: any = new Error("There are linting errors in the project");
              err.code = "ELINT";
              err.count = 0;
              err.output = _.map(this.lintingErrors, (result, file) => {
                const res = result.results[0];
                err.count += res.warnings.length;
                return res.warnings.map((warn: any) => `${file}[${warn.line}, ${warn.column}]: ${warn.text}`).join("\n");
              }).join("\n");
              throw err;
            }
          }));
  };
}
