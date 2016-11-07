import * as livereload from "livereload";
import config from "./config";

livereload.createServer({
  port: config.ports.livereload
})
  .watch([".tmp/main.css", "src/dev/index.dev.html"]);
