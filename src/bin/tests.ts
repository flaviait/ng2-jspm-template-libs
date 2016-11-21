#!/usr/bin/env node

import config from "../config/config";
import {ScriptLinter, TestRunner} from "../scripts";
import {StyleLinter} from "../styles";
import "../hmr";
import "../livereload";

new ScriptLinter(config.scripts.lint.dist)
  .start();

new StyleLinter(config.styles.lint.dist)
  .start();

new TestRunner(config.scripts.test.dist)
  .on("error", () => process.exit(1))
  .on("success", () => process.exit(0))
  .start();
