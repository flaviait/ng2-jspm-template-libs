#!/usr/bin/env node

import * as _ from "lodash";
import {fork} from "child_process";
import config from "../config/config";
import {ScriptLinter, TestRunner} from "../scripts";
import {StyleCompiler, StyleLinter} from "../styles";
import {TranslationCompiler} from "../translations";
import {Assets} from "../assets";
import {waitForChange} from "../utils";
import "../hmr";
import "../livereload";
import {StylesCompileConfig} from "../config/config.interface";

const onError = () => {
};

const assets = new Assets(config.assets.dev);

assets
  .clean()
  .on("clean", () => {
    assets.copy();
    new ScriptLinter(config.scripts.lint.dev).on("error", onError).start();
    new StyleLinter(config.styles.lint.dev).on("error", onError).start();
    if (_.isArray(config.styles.dev)) {
      (config.styles.dev as StylesCompileConfig[]).forEach(styleConfig =>
        new StyleCompiler(styleConfig).on("error", onError).start());
    } else {
      new StyleCompiler(config.styles.dev).on("error", onError).start();
    }
    new TranslationCompiler(config.translations.dev).on("error", onError).start();
    new TestRunner(config.scripts.test.dev).on("error", onError).start();
  });

waitForChange(config.scripts.dev.bundle)
  .then(() => fork(config.server.dev.entry));
