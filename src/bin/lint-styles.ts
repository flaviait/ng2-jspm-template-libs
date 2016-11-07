#!/usr/bin/env node

import * as program from "commander";
import {StyleLinter} from "../styles";
import config from "../config";

interface ProgramParams {
  files: string;
  watch?: boolean;
}

program
  .usage("[options] <files-glob>")
  .option("-w, --watch", "Watch the styles")
  .parse(process.argv);

const params = program as any as ProgramParams;
params.files = program.args[0];

const linter = new StyleLinter(
  params.files || config.styles.lint.files,
  params.watch)
  .start();

if (!params.watch) {
  linter.on("error", () => process.exit(1));
}
