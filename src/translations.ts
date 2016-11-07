import {EventEmitter} from "events";

import * as _ from "lodash";
import * as yaml from "js-yaml";
import * as log4js from "log4js";

import utils from "./utils";

const mapLeaves = (obj: any, iteratee: any, path: string[] = []): any => {
  return _.flatMap(obj, (value, key) => {
    if (_.isObject(value)) {
      return mapLeaves(value, iteratee, path.concat(key));
    } else {
      return iteratee(value, path.concat(key));
    }
  });
};

const setValueAt = (obj: any, path: string[], value: any) => {
  const next = path.shift();
  if (path.length === 0) {
    obj[next] = value;
  } else {
    obj[next] = obj[next] || {};
    setValueAt(obj[next], path, value);
  }
};

export class TranslationCompiler extends EventEmitter {

  private logger = log4js.getLogger("translations");

  constructor(private filesGlob: string,
              private output: string,
              private statistics: boolean,
              private watch?: boolean) {
    super();
  }

  start() {
    this.run();
    if (this.watch) {
      utils.watch(this.filesGlob, () => this.run(), {events: ["change", "unlink"]});
    }

    return this;
  }

  run() {
    this.compile()
      .then(
        () => {
          this.logger.debug(`Translations written to ${this.output}`);
          this.emit("success");
        },
        (err) => {
          this.logger.error("Error processing translation:", err);
          this.emit("error", err);
        });
  }

  private compile() {
    return utils.getFiles(this.filesGlob)
      .then(paths => Promise.all(paths.map(path =>
        utils.readFile(path).then(contents => ({contents, path})))))
      .then(files => Promise.all(files.map((file: {path: string, contents: string}) =>
        ({
          path: file.path,
          translations: yaml.safeLoad(file.contents, {filename: file.path})
        }))))
      .then(partials => this.statistics ? this.runStatistics(partials) : partials)
      .then(partials => _.defaultsDeep({}, ..._.map(partials, "translations")))
      .then(translations => this.byLanguage(translations))
      .then(translations => `export default ${JSON.stringify(translations, null, 4)};`)
      .then(content => utils.writeFile(this.output, content));
  }

  private runStatistics(partials: {path: string, translations: any}[]) {
    const translations = _.flatMap(partials, partial =>
      mapLeaves(partial.translations, (value: any, path: string[]) =>
        ({value, key: path.join("."), file: partial.path, lang: _.last(path)})));

    const duplicatedValues = _.chain(translations)
      .filter(translation => _.filter(translations, t => translation.value === t.value && translation.lang === t.lang).length > 1)
      .groupBy("value")
      .value();

    let duplicatedKeys = _.filter(translations, translation =>
    _.filter(translations, t => translation.key === t.key).length > 1);

    const conflictingKeys = _.chain(duplicatedKeys)
      .filter(translation => _.some(duplicatedKeys, t => translation.key === t.key && translation.value !== t.value))
      .groupBy("key")
      .value();

    const maxFileNameLength = _.maxBy(translations, t => t.file.length).file.length;

    if (_.size(conflictingKeys) > 0) {
      _.each(conflictingKeys, (conflictingTranslations, key) => {
        this.logger.error(`Conflict for "${key}":`);
        _.each(conflictingTranslations, t => {
          this.logger.error(`${_.padEnd(`${t.file} `, maxFileNameLength + 2, "-")}> ${t.value}`);
        });
      });
      throw new Error(`Translation failed: Conflicting translations.`);
    }
    _.each(duplicatedValues, (duplicatedTranslations, value) => {
      this.logger.debug(`Duplicated value for "${value}":`);
      _.each(duplicatedTranslations, t => {
        this.logger.debug(`${_.padEnd(`${t.file} `, maxFileNameLength + 2, "-")}> ${t.key}`);
      });
    });

    const duplicatedValuesPercent = _.size(duplicatedValues) / translations.length * 100;
    this.logger.debug(`Translation duplicates: ${_.size(duplicatedValues)} (${(duplicatedValuesPercent).toFixed(1)}%)`);
    return partials;
  }

  private byLanguage(translations: any) {
    const result = {};
    mapLeaves(translations, (value: any, path: string[]) => {
      setValueAt(result, [path.pop()].concat(path), value);
    });
    return result;
  }
}
