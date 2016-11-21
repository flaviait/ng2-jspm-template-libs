#!/usr/bin/env node

import {fork} from "child_process";
import config from "../config/config";
import {ScriptLinter, TestRunner} from "../scripts";
import {StyleCompiler, StyleLinter} from "../styles";
import {TranslationCompiler} from "../translations";
import {Assets} from "../assets";
import {waitForChange} from "../utils";
import "../hmr";
import "../livereload";

const onError = () => {
};

const assets = new Assets(config.assets.dev);

assets
  .clean()
  .on("clean", () => {
    assets.copy();
    new ScriptLinter(config.scripts.lint.dev).on("error", onError).start();
    new StyleLinter(config.styles.lint.dev).on("error", onError).start();
    new StyleCompiler(config.styles.dev).on("error", onError).start();
    new TranslationCompiler(config.translations.dev).on("error", onError).start();
    new TestRunner(config.scripts.test.dev).on("error", onError).start();
  });

waitForChange(config.scripts.dev.bundle)
  .then(() => fork(config.server.dev.entry));
