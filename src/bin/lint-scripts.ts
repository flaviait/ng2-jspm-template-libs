#!/usr/bin/env node

import * as program from "commander";
import {ScriptLinter} from "../scripts";
import config from "../config";

interface ProgramParams {
  files: string;
  exclude?: string;
  watch?: boolean;
}

program
  .usage("[options] <files-glob>")
  .option("-w, --watch", "Watch the scripts")
  .option("-e, --exclude <files-glob>", "Exclude pattern")
  .parse(process.argv);

const params = program as any as ProgramParams;
params.files = program.args[0];

const linter = new ScriptLinter(
  params.files || config.scripts.lint.files,
  params.exclude || config.scripts.lint.exclude,
  params.watch)
  .start();

if (!params.watch) {
  linter.on("error", () => process.exit(1));
}
