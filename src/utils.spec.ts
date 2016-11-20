import {copy, readFile, del} from "./utils";
import {afterEach, it, await} from "jasmine-await";

describe("utils", () => {

  describe("copy()", () => {

    afterEach(() => {
      await(del(".tmp"));
    });

    it("should copy a single file and remain paths", () => {
      await(copy({src: "spec/fixtures/1", dest: ".tmp"}));

      const originalContent = await(readFile("spec/fixtures/1"));
      const copyContent = await(readFile(".tmp/spec/fixtures/1"));

      expect(copyContent).toEqual(originalContent);
    });

    it("should copy a single file and remain paths relative to cwd", () => {
      await(copy({src: "fixtures/1", dest: ".tmp", cwd: "spec"}));

      const originalContent = await(readFile("spec/fixtures/1"));
      const copyContent = await(readFile(".tmp/fixtures/1"));

      expect(copyContent).toEqual(originalContent);
    });

    it("should copy with globbing support", () => {
      await(copy({src: "fixtures/*", dest: ".tmp", cwd: "spec"}));

      const originalContent = await(readFile("spec/fixtures/1"));
      const copyContent = await(readFile(".tmp/fixtures/1"));

      expect(copyContent).toEqual(originalContent);
    });
  });
});
