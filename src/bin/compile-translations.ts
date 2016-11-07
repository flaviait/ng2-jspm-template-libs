#!/usr/bin/env node

import * as program from "commander";
import config from "../config";
import {TranslationCompiler} from "../translations";

interface ProgramParams {
  files: string;
  output: string;
  statistics: boolean;
  watch: boolean;
}

program
  .usage("[options] <files-glob> <output>")
  .option("-w, --watch", "Watch the translation files")
  .option("-s, --statistics", "Log the statistics")
  .parse(process.argv);

const params = program as any as ProgramParams;
params.files = program.args[0];
params.output = program.args[1];

const compiler = new TranslationCompiler(
  params.files || config.translations.files,
  params.output || config.translations.output,
  params.watch,
  params.statistics)
  .start();

if (!params.watch) {
  compiler.on("error", () => process.exit(1));
}
