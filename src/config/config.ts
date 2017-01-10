import * as fs from "fs";
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
  try {
    const content = fs.readFileSync("config.ts", "utf-8");
    const compiled = ts.transpileModule(content, {compilerOptions: {module: ts.ModuleKind.CommonJS}});

    return runInNewContext(compiled.outputText, {
      exports: {},
      require
    }, {
      filename: "config.ts"
    }) as TemplateConfig;
  } catch (e) {
    logger.error(e);
  }
}

export default _.mergeWith({}, defaults, getConfig(), (objValue: any, srcValue: any) => {
  if (_.isArray(objValue)) {
    return srcValue;
  }
}) as TemplateConfig;
