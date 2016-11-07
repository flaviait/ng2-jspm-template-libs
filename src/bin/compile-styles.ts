#!/usr/bin/env node

import * as program from "commander";
import config from "../config";
import {StyleCompiler} from "../styles";

interface ProgramParams {
  entry: string;
  output: string;
  minify: boolean;
  watch: string;
}

program
  .usage("[options] <entry>")
  .option("-o, --output <file>", "The output file")
  .option("-w, --watch <glob>", "Watch the styles")
  .option("-m, --minify", "Minify the styles")
  .parse(process.argv);

const params = program as any as ProgramParams;
params.entry = program.args[0];

new StyleCompiler(
  params.entry || config.styles.entry,
  params.output,
  params.minify,
  params.watch)
  .start();
