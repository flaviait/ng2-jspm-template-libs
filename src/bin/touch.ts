#!/usr/bin/env node

import * as program from "commander";
import * as log4js from "log4js";

import * as utils from "../utils";

const logger = log4js.getLogger("touch");

interface ProgramParams {
  file: string;
}

program
  .usage("<file>")
  .parse(process.argv);

const params = program as any as ProgramParams;
params.file = program.args[0];

utils.writeFile(program.args[0], "", {flag: "wx"}).catch(error => {
  if (error.code !== "EEXIST") {
    logger.error(error.stack);
    process.exit(1);
  }
});
