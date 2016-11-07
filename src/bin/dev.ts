#!/usr/bin/env node

import config from "../config";
import {ScriptLinter, TestRunner} from "../scripts";
import {StyleCompiler, StyleLinter} from "../styles";
import {TranslationCompiler} from "../translations";
import * as del from "node-delete";
import "../hmr";
import "../livereload";

del.sync(".tmp");

new ScriptLinter(
  config.scripts.lint.files,
  config.scripts.lint.exclude,
  true)
  .start();

new StyleLinter(
  config.styles.lint.files,
  true)
  .start();

new StyleCompiler(
  config.styles.entry,
  config.styles.dev.output,
  false,
  config.styles.dev.watch)
  .start();

new TranslationCompiler(
  config.translations.files,
  config.translations.output,
  true,
  false)
  .start();

new TestRunner(true).start();
