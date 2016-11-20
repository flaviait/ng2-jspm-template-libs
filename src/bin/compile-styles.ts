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
  .option("-o, --output <file>", "The output file")
  .option("-w, --watch-pattern <glob>", "Watch the styles")
  .option("-d, --dev", "Use the dev configuration")
  .parse(process.argv);

const params = program as any as Params;
const defaults = params.dev ? config.styles.dev : config.styles.dist;
params.entry = program.args[0] || defaults.entry;

const compiler = new StyleCompiler(Object.assign({}, defaults, params));

if (!params.watchPattern) {
  compiler.on("error", () => process.exit(1));
}

compiler.start();
