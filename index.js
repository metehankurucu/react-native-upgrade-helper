const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const inquirer = require('inquirer');
const { blank } = require('./templates');

const ACTIONS = {
    NEW: 'Create new project',
    CONTINUE: 'Continue with the existing project'
}

const OPTIONS = {
    OPEN: 'open repository with browser',
    INSTALL: 'npm install latest',
    INSTALL_SPESIFIC: 'npm install with spesific version',
    NEXT: 'next step',
    PREVIOUS: 'previous step',
    LINK: 'run react-native link',
    POD_INSTALL: 'run pod install',
    RUN_IOS: 'run ios to check build',
    RUN_ANDROID: 'run android to check build',
    WAIT: 'just wait (if you handle it)',
    DONE: 'ok this package done, next!',
    PASS: 'not done this package, go with next',
}


const checkRepoFolder = async (repoUrl, folderName, folderPath = '/tree/master/') => {
    const endpoint = (repoUrl + folderPath + folderName).replace(/\n/g, '')
    try {
        const response = await axios.get(endpoint);
        if (Number(response.status) === 200) {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

const execute = (command, dir = '.', errorMessage = '') => new Promise((resolve, reject) => {
    console.log(`Running ${command}..`)
    exec(`cd ${dir} && ${command}`, (err, stdout, stderr) => {
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
                exec(`cd ${projectDir} && npx react-native link ${packageName}`);
                console.log('OK Linked');
                break;
            case OPTIONS.POD_INSTALL:
                await execute(`cd ios && pod install`, projectDir);
                break;
            case OPTIONS.WAIT:
                console.log('OK, continue with below choices when you are done')
                break;
            case OPTIONS.INSTALL:
                await execute(`npm install ${packageName}`, projectDir);
                break;
            case OPTIONS.INSTALL_SPESIFIC:
                const version = await question({ message: 'Enter the version', defaultValue: 'latest' })
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
                console.log('Invalid Operation')
                break;
        }
    } catch (error) {
        console.log('[ERROR] ', error)
    }
}

const choices = prompt({ type: 'list', name: 'option' });
const question = prompt({ type: 'input', name: 'question' });


const STEPS = {
    JS: [{
        message: ({ packageName }) => `INSTALL STEP: JUST JS, ${packageName} has not android or ios folder.`,
        options: [
            OPTIONS.INSTALL,
            OPTIONS.INSTALL_SPESIFIC,
            OPTIONS.OPEN,
            OPTIONS.NEXT,
        ]
    },
    {
        message: () => 'FINAL STEP',
        options: [
            OPTIONS.DONE,
            OPTIONS.PASS,
            OPTIONS.PREVIOUS
        ]
    }],
    NATIVE: [
        {
            message: ({ packageName, hasAndroidFolder, hasIosFolder }) => `INSTALL STEP: HAS NATIVE MODULES ${packageName}. android folder: ${hasAndroidFolder ? '✅' : '❌'} -  ios folder: ${hasIosFolder ? '✅' : '❌'}`,
            options: [
                OPTIONS.INSTALL,
                OPTIONS.INSTALL_SPESIFIC,
                OPTIONS.OPEN,
                OPTIONS.NEXT,
            ]
        },
        {
            message: () => 'LINK STEP',
            options: [
                OPTIONS.LINK,
                OPTIONS.POD_INSTALL,
                OPTIONS.WAIT,
                OPTIONS.OPEN,
                OPTIONS.NEXT,
                OPTIONS.PREVIOUS
            ]
        },
        {
            message: () => 'RUN STEP',
            options: [
                OPTIONS.RUN_ANDROID,
                OPTIONS.RUN_IOS,
                OPTIONS.NEXT,
                OPTIONS.PREVIOUS
            ]
        },
        {
            message: () => 'FINAL STEP',
            options: [
                OPTIONS.DONE,
                OPTIONS.PASS,
                OPTIONS.PREVIOUS
            ]
        }
    ]
};

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
                    option = await choices({ message: step.message({ packageName, hasAndroidFolder, hasIosFolder }), choices: step.options });

                    if (option === OPTIONS.DONE) {
                        installed.push(packageName);
                        delete packages[packageName];
                        fs.writeFileSync(`${projectDir}/upgradeHelper.json`, JSON.stringify({ installed, packages }));
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
        console.log('Done')
    } catch (error) {
        console.log(error)
    }
})()
