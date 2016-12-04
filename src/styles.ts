import * as fs from "fs";
import * as path from "path";
import {EventEmitter} from "events";

import * as _ from "lodash";
import * as sass from "node-sass";
import * as postcss from "postcss";
import * as styleLint from "stylelint";
import * as log4js from "log4js";
import * as sassGraph from "sass-graph";

import {StylesCompileConfig, StylesLintingConfig} from "./config/config.interface";
import utils from "./utils";

export class StyleCompiler extends EventEmitter {

  private logger = log4js.getLogger("global-styles");

  constructor(private config: StylesCompileConfig) {
    super();
  }

  start() {
    this.run();
    if (this.config.watch) {
      let filesToWatch = this.getFilesToWatch();
      const watcher = utils.watch(filesToWatch, () => {
        this.run();
        const newFilesToWatch = this.getFilesToWatch(entry);
        const addedDeps = _.without(newFilesToWatch, ...filesToWatch);
        const removedDeps = _.without(filesToWatch, ...newFilesToWatch);
        _.each(addedDeps, file => watcher.add(file));
        _.each(removedDeps, file => watcher.unwatch(file));
        filesToWatch = newFilesToWatch;
      });
    }

    return this;
  }

  getFilesToWatch() {
    return _.keys(sassGraph.parseFile(this.config.entry, {
      extensions: ["sass", "scss", "css"]
    }).index);
  }

  run() {
    this.compile()
      .then(
        () => {
          this.logger.debug(`Global styles written to ${this.config.output}`);
          this.emit("success");
        },
        (err) => {
          this.logger.error("Error processing global styles:", err);
          this.emit("error", err);
        });

    return this;
  }

  private preprocess(file: string) {
    return new Promise((resolve, reject) =>
      sass.render(_.assign({file: file}, this.config.sass, {
        sourceMapEmbed: true,
        sourceMapContents: true,
      }), (error, result) => {
        if (error) {
          error.message = `${error.line}:${error.column} ${error.message}`;
          reject(error);
        } else {
          resolve(result);
        }
      }));
  }

  private postprocess(processed: any) {
    return new Promise((resolve, reject) => {
      postcss((this.config.postcss || []).map(([pluginName, pluginConfig]) => {
        const plugin = require(pluginName);
        if (_.isFunction(pluginConfig)) {
          return plugin(pluginConfig);
        }
        return plugin;
      }))
        .process(processed.css, {map: {inline: false}, to: this.config.output})
        .then(
          (result: any) => resolve(result),
          reject
        );
    });
  }

  private write(processed: any) {
    return Promise.all([
      utils.writeFile(this.config.output, processed.css),
      utils.writeFile(`${this.config.output}.map`, processed.map)
    ]);
  }

  private compile() {
    return this.preprocess(this.config.entry)
      .then((processed) => this.postprocess(processed))
      .then((processed) => this.write(processed));
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
