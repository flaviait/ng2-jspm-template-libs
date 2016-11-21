import * as livereload from "livereload";
import config from "./config/config";

livereload.createServer({
  port: config.devPorts.livereload
})
  .watch([".tmp/main.css", "src/dev/index.dev.html"]);
