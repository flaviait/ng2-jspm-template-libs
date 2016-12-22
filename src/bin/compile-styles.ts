#!/usr/bin/env node

import * as program from "commander";
import config from "../config/config";
import {StyleCompiler} from "../styles";
import {StylesCompileConfig} from "../config/config.interface";

interface Params extends StylesCompileConfig {
  dev: boolean;
}

program
  .usage("[options] <entry>")
  .option("-o, --output <file>", "The output file. Alternatively the outDir option can be used when compiling multiple entries.")
  .option("-u, --out-dir <directory>", "The output directory. Should be used with multiple entries.")
  .option("-c, --cwd <direcctory>", "The directory that the entries are relative to. Only makes sense with specified outDir.")
  .option("-w, --watch", "Watch the styles")
  .option("-d, --dev", "Use the dev configuration")
  .parse(process.argv);

const params = program as any as Params;
const defaults = params.dev ? config.styles.dev[0] : config.styles.dist[0];
params.entry = program.args[0] || defaults.entry;

const compiler = new StyleCompiler(Object.assign({}, defaults, params));

if (!params.watch) {
  compiler.on("error", () => process.exit(1));
}

compiler.start();
