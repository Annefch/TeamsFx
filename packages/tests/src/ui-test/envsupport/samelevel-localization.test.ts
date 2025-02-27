// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @author Anne Fu <v-annefu@microsoft.com>
 */
import { expect } from "chai";
import * as fs from "fs-extra";
import { VSBrowser } from "vscode-extension-tester";
import {
  TreeViewTestContext,
  zipAppPackageNoenv,
} from "../treeview/treeviewContext";
import { Timeout } from "../../utils/constants";
import { openExistingProject } from "../../utils/vscodeOperation";
import { it } from "../../utils/it";
import * as path from "path";
import AdmZip from "adm-zip";
import { assert } from "chai";
import { dotenvUtil } from "../../utils/envUtil";

describe("Check Same level localization files are generated correctly when creating app package", function () {
  this.timeout(Timeout.testCase);
  let treeViewTestContext: TreeViewTestContext;
  let testRootFolder: string;

  beforeEach(async function () {
    // ensure workbench is ready
    this.timeout(Timeout.prepareTestCase);
    treeViewTestContext = new TreeViewTestContext("treeview");
    testRootFolder = treeViewTestContext.testRootFolder;
    await treeViewTestContext.before();
  });

  afterEach(async function () {
    this.timeout(Timeout.finishTestCase);
    await treeViewTestContext.after();
  });

  it(
    "[auto] Check App package is successfully generated with en.json",
    {
      testPlanCaseId: 30481003,
      author: "v-annefu@microsoft.com",
    },
    async function () {
      const projectPath = path.resolve(
        testRootFolder,
        "../",
        "src",
        "ui-test",
        "case-resources",
        "agent"
      );
      console.log("open project path" + projectPath);
      try {
        await openExistingProject(projectPath);
        await zipAppPackageNoenv();
        const appPackageZipPath = path.join(
          projectPath,
          "appPackage",
          "build",
          "appPackage.dev.zip"
        );
        const zip = new AdmZip(appPackageZipPath);
        const zipEntries = zip.getEntries();
        const enFile = zipEntries.find((x) => x.entryName === "en.json");
        console.log("verify file successfully");
        if (!enFile) {
          assert.fail("en file not found error");
        }
        const enfileString = enFile.getData().toString();
        const envPath = path.resolve(projectPath, "env", ".env.dev");
        const config = dotenvUtil.deserialize(
          fs.readFileSync(envPath, "utf-8")
        );
        const teamsappAppversion = config.obj["TEAMS_APP_VERSION"];
        const envOwner = config.obj["OWNER"];
        console.log("env teamsappversion:", teamsappAppversion);
        console.log("env owner:", envOwner);
        expect(enfileString.includes(teamsappAppversion)).to.be.true;
        expect(enfileString.includes(envOwner)).to.be.true;
      } catch (error) {
        console.log("error msg: ", error);
        await VSBrowser.instance.takeScreenshot("errorStep");
        assert.fail(error as string);
      }
    }
  );
});
