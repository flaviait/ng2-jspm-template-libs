import * as _ from "lodash";
import * as fs from "fs";
import {EventEmitter} from "events";
import * as log4js from "log4js";
import {ILinterOptions, LintResult, Linter} from "tslint";
import * as karma from "karma";

import {ScriptsLintingConfig, ScriptsTestConfig} from "./config/config.interface";
import * as utils from "./utils";

export class ScriptLinter extends EventEmitter {

  private configuration = JSON.parse(fs.readFileSync("tslint.json", "utf8"));
  private lintingErrors: {[file: string]: LintResult} = {};
  private logger = log4js.getLogger("lint-scripts");

  constructor(private config: ScriptsLintingConfig) {
    super();
  }

  start = () => {
    utils.getFiles(this.config.files, {ignore: this.config.exclude}).then(this.run);
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
    const lintOptions: ILinterOptions = {fix: false, formatter: "verbose"};

    return Promise.all(files.map(file =>
      utils.readFile(file).then(content => ({file, content}))))
      .then((fileObjs) =>
        new Promise((resolve, reject) => {
          for (let fileObj of fileObjs) {
            const linter = new Linter(lintOptions);
            linter.lint(fileObj.file, fileObj.content, this.configuration);
            const lintingResult = linter.getResult();

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

export class TestRunner extends EventEmitter {

  private logger = log4js.getLogger("tests");

  constructor(private config: ScriptsTestConfig) {
    super();
  }

  start() {
    (this.config.waitFor ? utils.waitForChange(this.config.waitFor) : Promise.resolve())
      .then(() => {
        const server = new karma.Server(this.config.karma, (statusCode) => {
          if (statusCode === 0) {
            this.emit("success");
          } else {
            this.emit("error");
          }
        });
        server
          .on("run_start", () => {
            this.logger.debug("Running tests ...");
          })
          .on("run_complete", () => {
            this.logger.debug("Completed");
            this.emit("run_complete");
          })
          .start();
      });
    process.on("SIGINT", () => {
      karma.stopper.stop({port: this.config.karma.port});
    });
    return this;
  }
}
