import * as _ from "lodash";
import * as fs from "fs";
import {EventEmitter} from "events";
import * as log4js from "log4js";
import * as Linter from "tslint";
import {LintResult} from "tslint/lib/lint";
import {Server as KarmaServer, ConfigOptions as KarmaOptions} from "karma";

import * as utils from "./utils";
import config from "./config";

interface KarmaConfig extends KarmaOptions {
  jspm: any;
}

export class ScriptLinter extends EventEmitter {

  private configuration = JSON.parse(fs.readFileSync("tslint.json", "utf8"));
  private lintingErrors: {[file: string]: LintResult} = {};
  private logger = log4js.getLogger("lint-scripts");

  constructor(private filesGlob: string,
              private excludePattern?: string,
              private watch?: boolean) {
    super();
  }

  start = () => {
    utils.getFiles(this.filesGlob, {ignore: this.excludePattern}).then(this.run);
    if (this.watch) {
      utils.watch(this.filesGlob, this.run);
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
        (e) => {
          if (e.code === "ELINT") {
            this.logger.error(`There are ${e.count} linting errors:` + "\n" + e.output);
          } else {
            this.logger.error(e.stack);
          }
          this.emit("error", e);
        }
      );
  };

  private lint = (files: string[]) => {
    const lintOptions = {configuration: this.configuration, formatter: "verbose"};

    return Promise.all(files.map(file =>
      utils.readFile(file).then(content => ({file, content}))))
      .then((fileObjs) =>
        new Promise((resolve, reject) => {
          for (let fileObj of fileObjs) {
            const lintingResult = new Linter(fileObj.file, fileObj.content, lintOptions).lint();
            if (lintingResult.failureCount > 0) {
              this.lintingErrors[fileObj.file] = lintingResult;
            } else {
              delete this.lintingErrors[fileObj.file];
            }
          }
          if (Object.keys(this.lintingErrors).length > 0) {
            const err: any = new Error("There are linting errors in the project");
            err.code = "ELINT";
            err.output = _.values(this.lintingErrors).map(result => {
              return result.failures.map((failure: any) => {
                const pos = failure.startPosition.lineAndCharacter;
                return `${failure.fileName}[${pos.line + 1}, ${pos.character}]: ${failure.failure} (${failure.ruleName})`;
              }).join("\n");
            }).join("\n");
            err.count = _.values(this.lintingErrors).reduce((count, result) => result.failureCount + count, 0);
            reject(err);
          } else {
            resolve();
          }
        }));
  };
}

export class TestRunner {

  private static karmaConfig: KarmaConfig = {
    basePath: "",
    frameworks: ["jspm", "jasmine"],
    jspm: {
      config: "jspm.config.js",
      browser: "jspm.test.js",
      loadFiles: [
        "src/test-setup.ts",
        {pattern: "src/**/*.spec.ts", watched: false, served: false}
      ]
    },
    reporters: ["dots"],
    port: 9876,
    colors: true,
    logLevel: "ERROR",
    autoWatch: true,
    browsers: ["PhantomJS"],
    singleRun: false
  };

  private logger = log4js.getLogger("tests");

  private karmaConf: KarmaConfig;
  private bundleFile: string;

  constructor(private dev: boolean) {
    this.bundleFile = this.dev ? config.scripts.dev.output : config.scripts.test.output;
    this.karmaConf = _.merge({}, TestRunner.karmaConfig, {
      files: [
        this.bundleFile,
        "jspm_packages/system-polyfills.js",
        {pattern: "tsconfig.json", served: true, included: false}
      ],
      preprocessors: {
        [this.bundleFile]: ["sourcemap"]
      },
    });
    if (!this.dev) {
      this.karmaConf.autoWatch = false;
      this.karmaConf.singleRun = true;
    }
  }

  start() {
    let waiting: Promise<void>;
    if (this.dev) {
      this.logger.debug(`Waiting for bundle: ${this.bundleFile}`);
      waiting = utils.waitForChange(this.bundleFile);
    } else {
      waiting = Promise.resolve();
    }
    return waiting
      .then(() => new Promise((resolve, reject) => {
        const server = new KarmaServer(this.karmaConf, (statusCode) => {
          if (statusCode === 0) {
            resolve();
          } else {
            reject();
          }
        });
        server
          .on("run_start", () => {
            this.logger.debug("Running tests ...");
          })
          .on("run_complete", () => {
            this.logger.debug("Completed");

          })
          .start();
      }));
  }
}
