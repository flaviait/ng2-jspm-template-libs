#!/usr/bin/env node

import config from "../config";
import {ScriptLinter, TestRunner} from "../scripts";
import {StyleLinter} from "../styles";
import "../hmr";
import "../livereload";

new ScriptLinter(
  config.scripts.lint.files,
  config.scripts.lint.exclude,
  false)
  .start();

new StyleLinter(
  config.styles.lint.files,
  false)
  .start();

new TestRunner(false)
  .start()
  .then(
    () => process.exit(0),
    () => process.exit(1));
