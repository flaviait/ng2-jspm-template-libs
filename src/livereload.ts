import * as livereload from "livereload";
import config from "./config/config";

if (config.livereload) {
  livereload.createServer({
    port: config.livereload.port
  })
    .watch(config.livereload.watch);
}
