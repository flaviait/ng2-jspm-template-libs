import * as log4js from "log4js";
import config from "./config/config";
import * as socketEmitter from "chokidar-socket-emitter";

if (config.hmr) {
  const logger = log4js.getLogger("hmr");
  const server = socketEmitter({
    port: config.hmr.port,
    path: config.hmr.root,
    quiet: true,
    chokidar: {
      ignored: /___jb.*$/ // IntelliJ Idea creates and removes a temporary file on each save
    }
  });

  server.watcher.on("all", (event: string, file: string) => {
    logger.debug(`${file} (${event})`);
  });
}
