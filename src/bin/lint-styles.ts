#!/usr/bin/env node

import * as program from "commander";
import {StyleLinter} from "../styles";
import config from "../config/config";
import {StylesLintingConfig} from "../config/config.interface";

interface Params extends StylesLintingConfig {
  dev: boolean;
}

program
  .usage("[options] <files-glob>")
  .option("-w, --watch", "Watch the styles")
  .parse(process.argv);

const params = program as any as Params;
const defaults = params.dev ? config.styles.lint.dev : config.styles.lint.dist;
params.files = program.args[0] || defaults.files;

const linter = new StyleLinter(Object.assign({}, defaults, params))
  .start();

if (!params.watch) {
  linter.on("error", () => process.exit(1));
}
