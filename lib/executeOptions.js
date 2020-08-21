const { exec } = require("child_process");
const execute = require("./execute");
const { question } = require("./prompt");
const { OPTIONS } = require("./constants");

const executeOptions = async (option, packageName, projectDir) => {
  try {
    switch (option) {
      case OPTIONS.LINK:
        exec(`cd ${projectDir} && npx react-native link ${packageName}`);
        console.log("OK Linked");
        break;
      case OPTIONS.POD_INSTALL:
        await execute(`cd ios && pod install`, projectDir);
        break;
      case OPTIONS.WAIT:
        console.log("OK, continue with below choices when you are done");
        break;
      case OPTIONS.INSTALL:
        await execute(`npm install ${packageName}`, projectDir);
        break;
      case OPTIONS.INSTALL_SPESIFIC:
        const version = await question({
          message: "Enter the version",
          defaultValue: "latest",
        });
        await execute(`npm install ${packageName}@${version}`, projectDir);
        break;
      case OPTIONS.OPEN:
        await execute(`npm repo ${packageName}`);
        break;
      case OPTIONS.RUN_ANDROID:
        await execute(`npx react-native run-android`, projectDir);
        break;
      case OPTIONS.RUN_IOS:
        await execute(`npx react-native run-ios`, projectDir);
        break;
      default:
        console.log("Invalid Operation");
        break;
    }
  } catch (error) {
    console.log("[ERROR] ", error);
  }
};

module.exports = executeOptions;
