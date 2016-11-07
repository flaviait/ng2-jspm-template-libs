import * as fs from "fs";
import * as yaml from "js-yaml";

export interface Config {
  ports: {
    dev: number;
    livereload: number;
    hmr: number;
  };
  scripts: {
    dev: {
      output: string;
    }
    test: {
      output: string;
    }
    dist: {
      output: string;
    }
    lint: {
      files: string;
      exclude: string;
    }
  };
  styles: {
    lint: {
      files: string;
    }
    entry: string;
    dev: {
      watch: string;
      output: string;
    };
    dist: {
      output: string;
    };
    sass: {
      includePaths: string[];
    };
    autoprefixer: {
      browsers: string[];
    };
    cssnano: {
      zindex: boolean;
    };
  };
  translations: {
    files: string;
    output: string;
  };
}

const content = fs.readFileSync("config.yml", "utf8");
const config: Config = yaml.safeLoad(content, {filename: "config.yml"});
export default config;
