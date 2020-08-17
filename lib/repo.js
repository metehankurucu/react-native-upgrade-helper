const axios = require("axios");
const execute = require("./execute");

const checkRepoFolder = async (
  repoUrl,
  folderName,
  folderPath = "/tree/master/"
) => {
  const endpoint = (repoUrl + folderPath + folderName).replace(/\n/g, "");
  try {
    const response = await axios.get(endpoint);
    if (Number(response.status) === 200) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const getRepoUrl = async (packageName) => {
  try {
    let repoUrl = await execute(`npm view ${packageName} repository.url`);
    repoUrl = repoUrl.replace("git+", "");
    repoUrl = repoUrl.replace("git://", "");
    repoUrl = repoUrl.replace("ssh://git@", "");
    repoUrl = repoUrl.replace("git+ssh://git@", "");
    repoUrl = repoUrl.replace(".git", "");
    if (!repoUrl.startsWith("https://")) {
      repoUrl = `https://${repoUrl}`;
    }
    return repoUrl;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  getRepoUrl,
  checkRepoFolder,
};
