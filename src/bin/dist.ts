#!/usr/bin/env node

import config from "../config/config";
import {ScriptLinter} from "../scripts";
import {StyleCompiler, StyleLinter} from "../styles";
import {TranslationCompiler} from "../translations";
import {Assets} from "../assets";

const onError = () =>
  process.exit(1);

const assets = new Assets(config.assets.dist).on("error", onError);

assets
  .clean()
  .on("clean", () => {
    assets.copy();
    new ScriptLinter(config.scripts.lint.dist).on("error", onError).start();
    new StyleLinter(config.styles.lint.dist).on("error", onError).start();
    config.styles.dist.forEach(styleConfig =>
      new StyleCompiler(styleConfig).on("error", onError).start());
    new TranslationCompiler(config.translations.dist).on("error", onError).start();
  });
