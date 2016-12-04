import {TemplateConfig, KarmaConfig, StylesCompileConfig} from "./config.interface";

const karmaConfig = (bundleFile: string, watch: boolean) => ({
  basePath: "",
  frameworks: ["jspm", "jasmine"],
  files: [
    bundleFile,
    "jspm_packages/system-polyfills.js",
    {pattern: "tsconfig.json", served: true, included: false}
  ],
  jspm: {
    config: "jspm.config.js",
    browser: "jspm.test.js",
    loadFiles: [
      "src/test-setup.ts",
      {pattern: "src/**/*.spec.ts", watched: false, served: false}
    ]
  },
  reporters: ["dots"],
  preprocessors: {
    [bundleFile]: ["sourcemap"]
  },
  port: 9876,
  colors: true,
  logLevel: "ERROR",
  autoWatch: watch,
  browsers: ["PhantomJS"],
  singleRun: !watch
} as KarmaConfig);

const stylesConfig = (dev: boolean) => ({
  entry: "src/styles/main.scss",
  output: dev ? ".tmp/main.css" : "dist/main.css",
  minify: !dev,
  watch: dev,
  sass: {
    includePaths: ["node_modules"]
  },
  postcss: dev ?
    [
      ["autoprefixer", {browsers: ["last 2 versions"]}]
    ] :
    [
      ["autoprefixer", {browsers: ["last 2 versions"]}],
      ["cssnano", {zindex: false}]
    ]
} as StylesCompileConfig);

const defaults: TemplateConfig = {
  devPorts: {
    livereload: 35728,
    hmr: 35727
  },
  srcPath: "src",
  tmpPath: ".tmp",
  distPath: "dist",
  server: {
    dev: {
      entry: "server/server-dev.js",
      port: 9987
    },
    dist: {
      entry: "server/server-dist.js",
      port: 9988
    },
  },
  assets: {
    dist: {
      copy: {
        src: "index.html",
        dest: "dist",
        cwd: "src"
      },
      clean: "dist"
    },
    dev: {
      clean: ".tmp"
    }
  },
  scripts: {
    dev: {
      bundle: ".tmp/dev-bundle.js"
    },
    dist: {
      bundle: "dist/bundle.js"
    },
    test: {
      dev: {
        karma: karmaConfig(".tmp/dev-bundle.js", true),
        waitFor: ".tmp/dev-bundle.js"
      },
      dist: {
        karma: karmaConfig(".tmp/test-bundle.js", false)
      }
    },
    lint: {
      dev: {
        files: "src/**/*.ts",
        exclude: "src/generated/**/*.ts",
        watch: true
      },
      dist: {
        files: "src/**/*.ts",
        exclude: "src/generated/**/*.ts"
      }
    }
  },
  styles: {
    dev: stylesConfig(true),
    dist: stylesConfig(false),
    lint: {
      dev: {
        files: "src/**/*.scss",
        watch: true
      },
      dist: {
        files: "src/**/*.scss"
      }
    }
  },
  translations: {
    dev: {
      files: "src/**/*.i18n.yml",
      output: "src/generated/translations.ts",
      statistics: true,
      watch: true
    },
    dist: {
      files: "src/**/*.i18n.yml",
      output: "src/generated/translations.ts",
      statistics: true
    }
  }
};

export default defaults;
