import * as _ from "lodash";
import {getLogger} from "log4js";
import {TemplateConfig} from "./config.interface";
import * as ts from "typescript";
import {runInNewContext} from "vm";
import defaults from "./config.defaults";

process.on("unhandledRejection", (err: Error) => {
  throw err;
});

const logger = getLogger("config");

function getConfig() {
  let config: TemplateConfig = null;

  const program = ts.createProgram(["config.ts"], {
    module: ts.ModuleKind.CommonJS
  });
  const emitResult = program.emit(undefined, (fileName: string, data: string) => {
    config = runInNewContext(data, {
      exports: {},
      require
    }, {
      filename: "config.ts"
    });
  });

  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  allDiagnostics.forEach(diagnostic => {
    let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    logger.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  });
  if (allDiagnostics.length > 0) {
    process.exit(1);
  }
  return config;
}

export default _.merge({}, defaults, getConfig());
