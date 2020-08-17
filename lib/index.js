const fs = require("fs");
const execute = require("./execute");
const { blank } = require("../templates");
const { ACTIONS, STEPS } = require("./constants");
const { choices, question } = require("./prompt");
const executeOptions = require("./executeOptions");
const { getRepoUrl, checkRepoFolder } = require("./repo");

module.exports = async () => {
  try {
    const action = await choices({
      message: "What do you want to do?",
      choices: [ACTIONS.NEW, ACTIONS.CONTINUE],
    });

    let projectDir = "";

    if (action === ACTIONS.NEW) {
      const projectName = await question({
        message: "Enter name of your React Native project",
        defaultValue: "react_native_upgrade",
      });
      let version = await question({
        message: "Which React Native version you want to upgrade?",
        defaultValue: "latest",
      });
      version = version !== "latest" ? `--version ${version}` : "";

      const dir = await question({
        message: "Enter directory path you want to create new project",
        defaultValue: ".",
      });
      console.log("Creating React Native project...");
      await execute(`npx react-native init ${projectName} ${version}`, dir);
      projectDir = dir + "/" + projectName;
      console.log("Project Created!");
      fs.writeFileSync(
        `${projectDir}/upgradeHelper.json`,
        JSON.stringify(blank)
      );
      console.log("upgradeHelper.json Created!");
      await question({
        message:
          "Copy your dependencies in the old project and paste them to packages property of upgradeHelper.json. Don't continue without do it.",
        defaultValue: "I did it!",
      });
    } else {
      projectDir = await question({
        message: "Enter the project directory path you want to continue with",
        defaultValue: "./react_native_upgrade",
      });

      await execute(
        `test -f upgradeHelper.json`,
        projectDir,
        "This project probably not an existing upgrade-helper project, you may want to create new project or create upgradeHelper.json file."
      );
    }

    const { installed, packages } = require(projectDir + "/upgradeHelper.json");

    let index = 0;

    const packageNames = Object.keys(packages);

    let packageName, repoUrl, hasAndroidFolder, hasIosFolder;

    for (index; index < packageNames.length; index++) {
      try {
        packageName = packageNames[index];

        repoUrl = await getRepoUrl(packageName);
        console.log("Checking repo, please wait...");
        hasAndroidFolder = await checkRepoFolder(repoUrl, "android");
        hasIosFolder = await checkRepoFolder(repoUrl, "ios");

        let option, steps, step;

        if (!hasAndroidFolder && !hasIosFolder) {
          //JUST JS PACKAGE
          steps = STEPS.JS;
        } else {
          //PACKAGE WITH NATIVE MODULES
          steps = STEPS.NATIVE;
        }

        for (let j = 0; j < steps.length; j++) {
          step = steps[j];
          option = await choices({
            message: step.message({
              packageName,
              hasAndroidFolder,
              hasIosFolder,
            }),
            choices: step.options,
          });

          if (option === OPTIONS.DONE) {
            installed.push(packageName);
            delete packages[packageName];
            fs.writeFileSync(
              `${projectDir}/upgradeHelper.json`,
              JSON.stringify({ installed, packages })
            );
          } else if (option === OPTIONS.PASS) {
            break;
          } else if (option === OPTIONS.NEXT) {
            continue;
          } else if (option === OPTIONS.PREVIOUS) {
            j -= 2;
          } else {
            await executeOptions(option, packageName, projectDir);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log("Done");
  } catch (error) {
    console.log(error);
  }
};
