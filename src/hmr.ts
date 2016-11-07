import * as log4js from "log4js";
import config from "./config";
import * as socketEmitter from "chokidar-socket-emitter";

const logger = log4js.getLogger("hmr");
const server = socketEmitter({
  port: config.ports.hmr,
  path: "src",
  quiet: true,
  chokidar: {
    ignored: /___jb.*$/ // IntelliJ Idea creates and removes a temporary file on each save
  }
});

export default server.watcher.on("all", (event: string, file: string) => {
  logger.debug(`${file} (${event})`);
});
