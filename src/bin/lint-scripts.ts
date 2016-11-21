#!/usr/bin/env node

import * as program from "commander";
import {ScriptLinter} from "../scripts";
import config from "../config/config";
import {ScriptsLintingConfig} from "../config/config.interface";

interface Params extends ScriptsLintingConfig {
  dev: boolean;
}

program
  .usage("[options] <files-glob>")
  .option("-w, --watch", "Watch the scripts")
  .option("-e, --exclude <files-glob>", "Exclude pattern")
  .option("-d, --dev", "Use the dev configuration")
  .parse(process.argv);

const params = program as any as Params;
const defaults = params.dev ? config.scripts.lint.dev : config.scripts.lint.dist;
params.files = program.args[0] || defaults.files;

const linter = new ScriptLinter(Object.assign({}, defaults, params));

if (!params.watch) {
  linter.on("error", () => process.exit(1));
}

linter.start();
