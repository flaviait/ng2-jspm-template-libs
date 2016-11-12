#!/usr/bin/env node

import config from "../config";
import {ScriptLinter} from "../scripts";
import {StyleCompiler, StyleLinter} from "../styles";
import {TranslationCompiler} from "../translations";

new ScriptLinter(
  config.scripts.lint.files,
  config.scripts.lint.exclude)
  .start()
  .on("error", () => process.exit(1));

new StyleLinter(
  config.styles.lint.files)
  .start()
  .on("error", () => process.exit(1));

new StyleCompiler(
  config.styles.entry,
  config.styles.dev.output,
  true)
  .start()
  .on("error", () => process.exit(1));

new TranslationCompiler(
  config.translations.files,
  config.translations.output,
  true,
  false)
  .start()
  .on("error", () => process.exit(1));
