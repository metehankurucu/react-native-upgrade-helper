const readline = require('readline');
const { exec } = require('child_process');
const axios = require('axios');
const shell = require('shelljs');
const fs = require('fs');
const inquirer = require('inquirer');
const yargs = require("yargs");


const { blank } = require('./templates');
const { option } = require('yargs');
// const options = yargs
//   .usage('Usage: -f <filename> --user1="<user1_name>" --user2="<user2_name>"')
//   .option("f", {
//     alias: "file",
//     describe: "Filename contains your messages",
//     type: "string",
//     demandOption: true,
//   }).argv;

/**
 * 1. repoya bakıp android & ios paket analizi
 * 2. (android & ios var ya da yok bilgilendirme ve yapılacağı sorma)
 *  2.1 saf js ise
 *      a. browserda aç
 *          a.1 Continue? (2.1)
 *      b. npm install and continue
 *      c. install with version(latest) and continue
 *      d. save to the uninstalled packages, I will install later
 *  2.2 native moodulleri varsa
 *      a. browserda aç
 *          a.1 Continue? (2.2)
 *      b. npm install and react-native link
 *          b.1 Run?
 *      c. install with version and react-native link
 * 
 * 
 * 
 */

const ACTIONS = {
    NEW: 'Create new project',
    CONTINUE: 'Continue with the existing project'
}

const OPTIONS = {
    OPEN: 'open repository with browser',
    INSTALL: 'npm install latest',
    INSTALL_SPESIFIC: 'npm install with spesific version',
    CONTINUE: 'continue with next step',
    LINK: 'run react-native link',
    POD_INSTALL: 'run pod install',
    RUN_IOS: 'run ios to check build',
    RUN_ANDROID: 'run android to check build',
    WAIT: 'just wait (if you handle it)',
    DONE: 'ok this package done, next!',
    PASS: 'not done this package, go with next',
}



/**
 * Save Link
 * il () {
        npm install --save "$1"
        react-native link "$1"
    }
    ilri () {
        npm install --save "$1"
        react-native link "$1"
        react-native run-ios
    }

    ilra () {
        npm install --save "$1"
        react-native link "$1"
        react-native run-android
    }
 */


//WHY /n added to endpoint??
const checkRepoFolder = async (repoUrl, folderName, folderPath = '/tree/master/') => {
    const endpoint = (repoUrl + folderPath + folderName).replace(/\n/g, '')
    try {
        const response = await axios.get(endpoint);
        if (Number(response.status) === 200) {
            // console.log('Exist')
            return true;
        }
        // console.log('Does not exist')
        return false;
    } catch (error) {
        // fs.writeFileSync(`${endpoint.replace(/\//g, '-')}.json`, JSON.stringify(error));
        if (Number(error.response.status) === 404) {
            // console.log('Does not exist')
        } else {
            // console.log('Another error occured');
        }
        return false;
    }
}

const execute = (command, dir = '.', errorMessage = '') => new Promise((resolve, reject) => {
    console.log(`cd ${dir} && ${command}`)
    exec(`cd ${dir} && ${command}`, (err, stdout, stderr) => {
        console.warn({ err, stdout, stderr })
        if (err) {
            return reject(errorMessage || err)
        }
        if (stderr) {
            return reject(errorMessage || stderr);
        }
        console.log(stdout);
        resolve(stdout);
    });
});


const isLastCommandSuccess = async () => {
    const code = await execute('echo $?');
    return Number(code) === 0
}


const getRepoUrl = async (packageName) => {
    try {
        let repoUrl = await execute(`npm view ${packageName} repository.url`);
        repoUrl = repoUrl.replace('git+', '');
        repoUrl = repoUrl.replace('git://', '');
        repoUrl = repoUrl.replace('ssh://git@', '');
        repoUrl = repoUrl.replace('git+ssh://git@', '');
        repoUrl = repoUrl.replace('.git', '');
        if (!repoUrl.startsWith('https://')) {
            repoUrl = `https://${repoUrl}`;
        }
        return repoUrl;
    } catch (error) {
        console.log(error)
        return false;
    }
}


const prompt = ({ type, name }) => {
    return async ({ message, defaultValue = false, ...options }) => {
        try {
            const answer = await inquirer.prompt([
                {
                    name,
                    type,
                    message,
                    default: () => defaultValue,
                    ...options
                }
            ]);
            return answer[name];
        } catch (error) {
            console.log('Error when prompting', error)
            return defaultValue;
        }
    }
}

const executeOptions = async (option, packageName, projectDir) => {
    try {
        switch (option) {
            case OPTIONS.LINK:
                console.log(`npx react-native link ${packageName}`)
                await execute(`npx react-native link ${packageName}`, projectDir);
                break;
            case OPTIONS.POD_INSTALL:
                await execute(`cd ios && pod install`, projectDir);
                break;
            case OPTIONS.WAIT:
                console.log('OK, continue with below choices when you are done')
                break;
            case OPTIONS.DONE:
                break;
            case OPTIONS.CONTINUE:
                break;
            case OPTIONS.INSTALL:
                await execute(`npm install ${packageName}`, projectDir);
                break;
            case OPTIONS.INSTALL_SPESIFIC:
                const version = await question({ message: 'Enter the version', defaultValue: 'latest' })
                await execute(`npm install ${packageName}@${version}`, projectDir);
                break;
            case OPTIONS.OPEN:
                await execute(`npm repo ${packageName}`, projectDir);
                break;
            case OPTIONS.RUN_ANDROID:
                await execute(`npx react-native run-android`, projectDir);
                break;
            case OPTIONS.RUN_IOS:
                await execute(`npx react-native run-ios`, projectDir);
                break;
            default:
                console.log('Invalid Operation')
                break;
        }
    } catch (error) {
        console.log('[ERROR] ', error)
    }

}

const choices = prompt({ type: 'list', name: 'option' });
const question = prompt({ type: 'input', name: 'question' });

(async () => {
    try {
        const action = await choices({ message: 'What do you want to do?', choices: [ACTIONS.NEW, ACTIONS.CONTINUE] });

        let projectDir = '';

        if (action === ACTIONS.NEW) {

            const projectName = await question({ message: 'Enter name of your React Native project', defaultValue: 'react_native_upgrade' });
            let version = await question({ message: 'Which React Native version you want to upgrade?', defaultValue: 'latest' });
            version = version !== 'latest' ? `--version ${version}` : '';

            const dir = await question({ message: 'Enter directory path you want to create new project', defaultValue: '.' });
            console.log('Creating React Native project...')
            await execute(`npx react-native init ${projectName} ${version}`, dir);
            projectDir = dir + '/' + projectName
            console.log('Project Created!');
            fs.writeFileSync(`${projectDir}/upgradeHelper.json`, JSON.stringify(blank));
            console.log('upgradeHelper.json Created!');
            await question({ message: 'Copy your dependencies in the old project and paste them to packages property of upgradeHelper.json. Don\'t continue without do it.', defaultValue: 'I did it!' });
        } else {
            projectDir = await question({ message: 'Enter the project directory path you want to continue with', defaultValue: './react_native_upgrade' });

            await execute(`test -f upgradeHelper.json`, projectDir, 'This project probably not an existing upgrade-helper project, you may want to create new project or create upgradeHelper.json file.');
        }

        const { installed, packages } = require(projectDir + '/upgradeHelper.json');

        let index = 0;

        const packageNames = Object.keys(packages);

        let packageName, repoUrl, hasAndroidFolder, hasIosFolder;

        for (index; index < packageNames.length; index++) {
            try {
                packageName = packageNames[index];

                repoUrl = await getRepoUrl(packageName);
                console.log('Checking repo, please wait...')
                hasAndroidFolder = await checkRepoFolder(repoUrl, 'android');
                hasIosFolder = await checkRepoFolder(repoUrl, 'ios');

                let message, option;

                if (!hasAndroidFolder && !hasIosFolder) {
                    //JUST JS PACKAGE
                    message = `INSTALL STEP: JUST JS, ${packageName} has not android or ios folder. It's just js.`,
                        //FIRST OPERATION (INSTALL)
                        option = await choices({
                            message, choices: [
                                OPTIONS.INSTALL,
                                OPTIONS.INSTALL_SPESIFIC,
                                OPTIONS.OPEN,
                                OPTIONS.CONTINUE,
                            ]
                        });

                    await executeOptions(option, packageName, projectDir);
                } else {
                    //PACKAGE WITH NATIVE MODULES
                    message = `INSTALL STEP: HAS NATIVE MODULES ${packageName} has android folder ${hasAndroidFolder ? '✅' : '❌'} -  ios folder ${hasIosFolder ? '✅' : '❌'}`;
                    //FIRST OPERATION (INSTALL)
                    option = await choices({
                        message, choices: [
                            OPTIONS.INSTALL,
                            OPTIONS.INSTALL_SPESIFIC,
                            OPTIONS.OPEN,
                            OPTIONS.CONTINUE,
                        ]
                    });

                    await executeOptions(option, packageName, projectDir);

                    //SECOND OPERATION (CONFIG-LINK)
                    option = await choices({
                        message: 'LINK STEP', choices: [
                            OPTIONS.LINK,
                            OPTIONS.POD_INSTALL,
                            OPTIONS.WAIT,
                            OPTIONS.OPEN,
                            OPTIONS.CONTINUE,
                        ]
                    });

                    await executeOptions(option, packageName, projectDir);

                    //THIRD OPERATION (RUN)
                    option = await choices({
                        message: 'RUN STEP', choices: [
                            OPTIONS.RUN_ANDROID,
                            OPTIONS.RUN_IOS,
                            OPTIONS.CONTINUE,
                        ]
                    });

                    await executeOptions(option, packageName, projectDir);
                }

                //FINAL OPERATION (DONE OR PASS)
                option = await choices({
                    message: 'Final Step',
                    choices: [
                        OPTIONS.DONE,
                        OPTIONS.PASS,
                    ]
                });

                if (option === OPTIONS.DONE) {
                    installed.push(packageName);
                    delete packages[packageName];
                    fs.writeFileSync(`${projectDir}/upgradeHelper.json`, JSON.stringify({ installed, packages }));
                } else if (option === OPTIONS.PASS) {
                    continue;
                }
            } catch (error) {
                console.error(error);
            }
        }
        console.log('Done')
    } catch (error) {
        console.log(error)
    }
})()
