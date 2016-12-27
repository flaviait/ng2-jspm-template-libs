import {beforeAll, afterAll, it, await as waitFor} from "jasmine-await";
import * as log4js from "log4js";
import {copy, readFile, writeFile, del} from "./utils";
import {StyleCompiler} from "./styles";
import {StylesCompileConfig} from "./config/config.interface";

describe("StyleCompiler", () => {

  let compiler: StyleCompiler;

  const compiled = () =>
    new Promise((resolve, reject) =>
      compiler
        .once("success", resolve)
        .once("error", reject));

  const createAndWaitForFirstRun = (options: StylesCompileConfig) => {
    compiler = new StyleCompiler(options).start();
    waitFor(Promise.all([compiled()].concat(options.watch ? [new Promise(resolve => compiler.once("watch", resolve))] : [])));
  };

  const outputWithoutSpaces = (file: string) => {
    return waitFor(readFile(`.tmp/compiled/${file}`)).replace(/\s/g, "");
  };

  const stopCompiler = () => compiler.stop();

  const writeVersion = (file: string, version: number) => {
    const content = waitFor(readFile(`.tmp/fixtures/${file}`))
      .replace(/(version\s*)\d+/, `$1${version.toString()}`);
    waitFor(Promise.all([compiled(), writeFile(`.tmp/fixtures/${file}`, content)]));
  };

  beforeAll(() => {
    log4js.getLogger("compile-styles").setLevel(log4js.levels.OFF);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
  });

  afterAll(() => {
    log4js.getLogger("compile-styles").setLevel(log4js.levels.TRACE);
    waitFor(del(".tmp"));
  });

  describe("start()", () => {

    describe("single entry", () => {

      beforeAll(() => waitFor(copy({cwd: "spec", src: "fixtures/**/*.scss", dest: ".tmp"})));

      describe("without watch", () => {

        it("should initially compile the styles", () => {
          createAndWaitForFirstRun({
            entry: ".tmp/fixtures/a.entry.scss",
            output: ".tmp/compiled/test.css"
          });

          const output = outputWithoutSpaces("test.css");
          expect(output).toMatch('a{content:"version1";}');
          expect(output).toMatch('b{content:"version1";}');
          expect(output).toMatch('c{content:"version1";}');
        });
      });

      describe("with watch", () => {

        beforeAll(() => {
          createAndWaitForFirstRun({
            entry: ".tmp/fixtures/a.entry.scss",
            output: ".tmp/compiled/test.css",
            watch: true
          });
        });

        afterAll(stopCompiler);

        it("should initially compile the styles", () => {
          const output = outputWithoutSpaces("test.css");
          expect(output).toMatch('a{content:"version1";}');
          expect(output).toMatch('b{content:"version1";}');
          expect(output).toMatch('c{content:"version1";}');
        });

        it("should compile on entry file change", () => {
          writeVersion("a.entry.scss", 2);

          expect(outputWithoutSpaces("test.css")).toMatch('a{content:"version2";}');
        });

        it("should compile on direct dependency change", () => {
          writeVersion("b.scss", 2);

          expect(outputWithoutSpaces("test.css")).toMatch('b{content:"version2";}');
        });

        it("should compile on direct dependency change", () => {
          writeVersion("c.scss", 2);

          expect(outputWithoutSpaces("test.css")).toMatch('c{content:"version2";}');
        });
      });
    });

    describe("multiple entries", () => {

      beforeAll(() => waitFor(copy({cwd: "spec", src: "fixtures/**/*.scss", dest: ".tmp"})));

      describe("without watch", () => {

        it("should initially compile the styles", () => {
          createAndWaitForFirstRun({
            entry: "*.entry.scss",
            outDir: ".tmp/compiled",
            cwd: ".tmp/fixtures"
          });

          const output = outputWithoutSpaces("a.entry.css");
          expect(output).toMatch('a{content:"version1";}');
          expect(output).toMatch('b{content:"version1";}');
          expect(output).toMatch('c{content:"version1";}');
        });
      });

      describe("with watch", () => {

        beforeAll(() => {
          createAndWaitForFirstRun({
            entry: "*.entry.scss",
            outDir: ".tmp/compiled",
            cwd: ".tmp/fixtures",
            watch: true
          });
        });

        afterAll(stopCompiler);

        it("should initially compile the styles", () => {
          const output = outputWithoutSpaces("a.entry.css");
          expect(output).toMatch('a{content:"version1";}');
          expect(output).toMatch('b{content:"version1";}');
          expect(output).toMatch('c{content:"version1";}');
        });

        it("should compile on entry file change", () => {
          writeVersion("a.entry.scss", 2);

          expect(outputWithoutSpaces("a.entry.css")).toMatch('a{content:"version2";}');
        });

        it("should compile on direct dependency change", () => {
          writeVersion("b.scss", 2);

          expect(outputWithoutSpaces("a.entry.css")).toMatch('b{content:"version2";}');
        });

        it("should compile on direct dependency change", () => {
          writeVersion("c.scss", 2);

          expect(outputWithoutSpaces("a.entry.css")).toMatch('c{content:"version2";}');
        });

        it("should compile entry file on add", () => {
          writeFile(".tmp/fixtures/d.entry.scss", 'd{content:"version1";}');
          waitFor(compiled());

          expect(outputWithoutSpaces("d.entry.css")).toMatch('d{content:"version1";}');
        });
      });
    });
  });
});
