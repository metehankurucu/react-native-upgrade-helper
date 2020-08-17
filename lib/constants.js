const ACTIONS = {
  NEW: "Create new project",
  CONTINUE: "Continue with the existing project",
};

const OPTIONS = {
  OPEN: "open repository with browser",
  INSTALL: "npm install latest",
  INSTALL_SPESIFIC: "npm install with spesific version",
  NEXT: "next step",
  PREVIOUS: "previous step",
  LINK: "run react-native link",
  POD_INSTALL: "run pod install",
  RUN_IOS: "run ios to check build",
  RUN_ANDROID: "run android to check build",
  WAIT: "just wait (if you handle it)",
  DONE: "ok this package done, next!",
  PASS: "not done this package, go with next",
};

const STEPS = {
  JS: [
    {
      message: ({ packageName }) =>
        `INSTALL STEP: JUST JS, ${packageName} has not android or ios folder.`,
      options: [
        OPTIONS.INSTALL,
        OPTIONS.INSTALL_SPESIFIC,
        OPTIONS.OPEN,
        OPTIONS.NEXT,
      ],
    },
    {
      message: () => "FINAL STEP",
      options: [OPTIONS.DONE, OPTIONS.PASS, OPTIONS.PREVIOUS],
    },
  ],
  NATIVE: [
    {
      message: ({ packageName, hasAndroidFolder, hasIosFolder }) =>
        `INSTALL STEP: HAS NATIVE MODULES ${packageName}. android folder: ${
          hasAndroidFolder ? "✅" : "❌"
        } -  ios folder: ${hasIosFolder ? "✅" : "❌"}`,
      options: [
        OPTIONS.INSTALL,
        OPTIONS.INSTALL_SPESIFIC,
        OPTIONS.OPEN,
        OPTIONS.NEXT,
      ],
    },
    {
      message: () => "LINK STEP",
      options: [
        OPTIONS.LINK,
        OPTIONS.POD_INSTALL,
        OPTIONS.WAIT,
        OPTIONS.OPEN,
        OPTIONS.NEXT,
        OPTIONS.PREVIOUS,
      ],
    },
    {
      message: () => "RUN STEP",
      options: [
        OPTIONS.RUN_ANDROID,
        OPTIONS.RUN_IOS,
        OPTIONS.NEXT,
        OPTIONS.PREVIOUS,
      ],
    },
    {
      message: () => "FINAL STEP",
      options: [OPTIONS.DONE, OPTIONS.PASS, OPTIONS.PREVIOUS],
    },
  ],
};

module.exports = {
  ACTIONS,
  OPTIONS,
  STEPS,
};
