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
  entry?: string;
  output?: string;
  minify?: boolean;
  watch?: boolean;
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
  copy?: CopyConfig | CopyConfig[];
  clean?: string | string[];
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
    dev?: StylesCompileConfig;
    dist?: StylesCompileConfig;
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
