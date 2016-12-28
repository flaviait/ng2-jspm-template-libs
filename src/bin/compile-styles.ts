#!/usr/bin/env node

import * as _ from "lodash";
import * as program from "commander";
import config from "../config/config";
import {StyleCompiler} from "../styles";
import {StylesCompileConfig} from "../config/config.interface";

interface Params extends StylesCompileConfig {
  dev: boolean;
  index: number;
}

program
  .usage("[options] <entry>")
  .option("-o, --output <file>", "The output file. Alternatively the outDir option can be used when compiling multiple entries.")
  .option("-u, --out-dir <directory>", "The output directory. Should be used with multiple entries.")
  .option("-c, --cwd <direcctory>", "The directory that the entries are relative to. Only makes sense with specified outDir.")
  .option("-w, --watch", "Watch the styles")
  .option("-d, --dev", "Use the dev configuration")
  .option("-i, --index <index>", "Use the default config of the specified index. Only makes sense with an array of style configs")
  .parse(process.argv);

const params = program as any as Params;
params.index = Number(params.index) || 0;
const defaults: StylesCompileConfig = params.dev ?
  (config.styles.dev as StylesCompileConfig[])[params.index] || config.styles.dev :
  (config.styles.dist as StylesCompileConfig[])[params.index] || config.styles.dist;
params.entry = program.args[0] || defaults.entry;

_.defaults(params, defaults);

const compiler = new StyleCompiler(params);

if (!params.watch) {
  compiler.on("error", () => process.exit(1));
}

compiler.start();
