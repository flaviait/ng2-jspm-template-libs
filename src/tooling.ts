import * as _ from "lodash";
import {Assets} from "./assets";
import {StylesCompileConfig, ScriptsLintingConfig} from "./config/config.interface";
import {ScriptLinter, TestRunner} from "./scripts";
import {StyleLinter, StyleCompiler} from "./styles";
import {TranslationCompiler} from "./translations";
import config from "./config/config";

let assets: Assets;

export function startTooling(mode: "dev" | "dist", withTests: true, onError: Function) {
  const start = () => {
    if (assets) {
      assets.copy();
    }

    if (config.scripts) {
      if (config.scripts.lint && (config.scripts.lint as any)[mode]) {
        new ScriptLinter((config.scripts.lint as any)[mode]).on("error", onError).start();
      }
      if (withTests && config.scripts.test && (config.scripts.test as any)[mode]) {
        new TestRunner((config.scripts.test as any)[mode]).on("error", onError).start();
      }
    }

    if (config.styles) {
      if (config.styles.lint && (config.styles.lint as any)[mode]) {
        new StyleLinter((config.styles.lint as any)[mode]).on("error", onError).start();
      }
      if ((config.styles as any)[mode]) {
        if (_.isArray((config.styles as any)[mode])) {
          ((config.styles as any)[mode] as StylesCompileConfig[]).forEach(styleConfig =>
            new StyleCompiler(styleConfig).on("error", onError).start());
        } else {
          new StyleCompiler((config.styles as any)[mode]).on("error", onError).start();
        }
      }
    }

    if (config.translations && (config.translations as any)[mode]) {
      new TranslationCompiler((config.translations as any)[mode]).on("error", onError).start();
    }
  };

  if (config.assets && (config.assets as any)[mode]) {
    assets = new Assets((config.assets as any)[mode]);
    assets
      .clean()
      .on("clean", start);
  } else {
    start();
  }
}
