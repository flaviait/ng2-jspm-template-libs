import {ConfigOptions as KarmaOptions} from "karma";

export interface ServerConfig {
  entry?: string;
  port?: number;
}

export interface KarmaConfig extends KarmaOptions {
  jspm?: any;
}

export interface ScriptsTestConfig {
  karma?: KarmaConfig;
  waitFor?: string;
}

export interface ScriptsLintingConfig {
  files?: string;
  exclude?: string | string[];
  watch?: boolean;
}

export interface SassConfig {
  includePaths?: string[];
}

export interface StylesCompileConfig {
  /**
   * One or multiple entry files. Also globbing patterns can be used.
   */
  entry?: string | string[];
  /**
   * Use this option to change the directory that the entry file(s) are relative to.
   * This will have an influence on the directory structure if used together with the outDir option:
   * When the output is written, the entry files directory will be flattened down to the cwd.
   */
  cwd?: string;
  /**
   * Use this option for one single output file.
   * This is an alternative to the outDir option.
   */
  output?: string;
  /**
   * Use this option for multiple entry files.
   * This is an alternative to the output option.
   */
  outDir?: string;
  /**
   * If set to true, the sass files will be watched and recompiled.
   */
  watch?: boolean;
  /**
   * If set to true, the output will be wrapped in a module which exports the css as default.
   */
  asESModule?: boolean;
  /**
   * Whether to output source map files.
   */
  sourceMaps?: boolean;
  /**
   * The configuration for node-sass.
   */
  sass?: SassConfig;
  /**
   * A postcss configuration looks like this:
   * [[pluginName, pluginConfig], ...]
   */
  postcss?: any[][];
}

export interface StylesLintingConfig {
  files?: string;
  watch?: boolean;
}

export interface TranslationsConfig {
  files?: string;
  output?: string;
  watch?: boolean;
  statistics?: boolean;
}

export interface CopyConfig {
  src: string | string[];
  dest: string;
  cwd?: string;
}

export interface AssetsConfig {
  copy?: CopyConfig | CopyConfig[] | false;
  clean?: string | string[] | false;
}

export interface ScriptsConfig {
  bundle?: string;
}

export interface TemplateConfig {
  devPorts?: {
    livereload?: number;
    hmr?: number;
  };
  srcPath?: string;
  tmpPath?: string;
  distPath?: string;
  server?: {
    dev?: ServerConfig;
    dist?: ServerConfig;
  };
  assets?: {
    dev?: AssetsConfig;
    dist?: AssetsConfig;
  };
  scripts?: {
    dev?: ScriptsConfig;
    dist?: ScriptsConfig;
    test?: {
      dev?: ScriptsTestConfig;
      dist?: ScriptsTestConfig;
    };
    lint?: {
      dev?: ScriptsLintingConfig;
      dist?: ScriptsLintingConfig;
    };
  };
  styles?: {
    dev?: StylesCompileConfig | StylesCompileConfig[];
    dist?: StylesCompileConfig | StylesCompileConfig[];
    lint?: {
      dev?: StylesLintingConfig;
      dist?: StylesLintingConfig;
    };
  };
  translations?: {
    dev?: TranslationsConfig;
    dist?: TranslationsConfig;
  };
}
