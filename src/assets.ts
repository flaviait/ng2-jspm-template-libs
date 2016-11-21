import {EventEmitter} from "events";
import {AssetsConfig} from "./config/config.interface";
import {getLogger} from "log4js";
import {del, copy} from "./utils";

export class Assets extends EventEmitter {

  private logger = getLogger("assets");

  constructor(private config: AssetsConfig) {
    super();
  }

  clean() {
    del(this.config.clean)
      .then(() => {
          this.logger.debug("Clean complete.");
          this.emit("clean");
        },
        e => {
          this.logger.error("Error during cleaning", e);
          this.emit("error", e);
        });
    return this;
  }

  copy() {
    copy(this.config.copy)
      .then(() => {
          this.logger.debug("Copy complete.");
          this.emit("copy");
        },
        e => {
          this.logger.error("Error during copying", e);
          this.emit("error", e);
        });
    return this;
  }

}
