#!/usr/bin/env node

import * as program from "commander";
import config from "../config/config";
import {TranslationCompiler} from "../translations";
import {TranslationsConfig} from "../config/config.interface";

interface Params extends TranslationsConfig {
  dev: boolean;
}

program
  .usage("[options] <files-glob> <output>")
  .option("-w, --watch", "Watch the translation files")
  .option("-s, --statistics", "Log the statistics")
  .option("-d, --dev", "Use the dev configuration")
  .parse(process.argv);

const params = program as any as Params;
const defaults = params.dev ? config.translations.dev : config.translations.dist;
params.files = program.args[0] || defaults.files;
params.output = program.args[1] || defaults.output;

const compiler = new TranslationCompiler(Object.assign({}, defaults, params));

if (!params.watch) {
  compiler.on("error", () => process.exit(1));
}

compiler.start();
