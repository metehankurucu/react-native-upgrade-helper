const { exec } = require("child_process");
const path = require('path');

const execute = (command, dir = ".", errorMessage = "") =>
  new Promise((resolve, reject) => {
    console.log(`Running ${command}..`);
    const cwd = path.join(process.cwd(), dir)
    exec(command, { cwd }, (err, stdout, stderr) => {
      if (err) {
        return reject(errorMessage || err);
      }
      if (stderr) {
        return reject(errorMessage || stderr);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });

module.exports = execute;
