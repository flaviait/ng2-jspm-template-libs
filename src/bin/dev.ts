#!/usr/bin/env node

import * as _ from "lodash";
import {fork} from "child_process";
import config from "../config/config";
import {waitForChange} from "../utils";
import "../hmr";
import "../livereload";
import {startTooling} from "../tooling";

startTooling("dev", true, _.noop);

if (config.scripts && config.scripts.dev && config.scripts.dev.bundle) {
  waitForChange(config.scripts.dev.bundle)
    .then(() => fork(config.server.dev.entry));
} else if (config.server && config.server.dev) {
  fork(config.server.dev.entry);
}
