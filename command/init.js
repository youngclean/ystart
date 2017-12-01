"use strict";
const exec = require("child_process").exec;
const co = require("co");
const prompt = require("co-prompt");
const config = require("../config");
const chalk = require("chalk");
const shelljs = require("shelljs");
const fs = require("fs");

const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    console.log(chalk.white(`Start to exec commands:${command}`));
    const cmd = exec(command, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });

    cmd.stdout.on("data", data => {
      console.log(data);
    });
  });
}

const endFun = (projectName) => {
  console.log(chalk.green("\n √ Generation completed!"));
  console.log(chalk.bold(`\n Next: cd ${projectName} && npm start`));
  process.exit();
}

module.exports = () => {
  co(function*() {
    // 处理用户输入
    const projectGitUrl = yield prompt("Project Git Url(没有就不用写): ");
    const hasGit = projectGitUrl.split(".git").length > 1;
    let projectName = "";
    if (hasGit) {
      projectName = projectGitUrl
        .split(".git")[0]
        .substr(projectGitUrl.lastIndexOf("/") + 1);
    } else {
      projectName = yield prompt("Project name: ");
    }

    // 避免重复添加
    if (!config.project[projectName]) {
      config.project[projectName] = {};
      config.project[projectName]["name"] = projectName;
    } else {
      console.log(chalk.red("Project has already existed!"));
      process.exit();
    }

    const checkCnpm = yield prompt.confirm("是否安装了cnpm?(y or n): ");
    const webpackGitUrl = "https://github.com/youngclean/webpack-hot-demo.git";

    console.log(chalk.blue("Start generating..."));

    execPromise(`git clone ${webpackGitUrl}`).then(() => {
      const currentDir = shelljs.pwd();
      const webpackDir = `${currentDir}/webpack-hot-demo`;
      // 删除webpackDir中的无效文件
      shelljs.rm("-rf", `${webpackDir}/.git`);
      shelljs.rm("-rf", `${webpackDir}/README.md`);
      shelljs.rm("-rf", `${webpackDir}/LICENSE`);
      shelljs.rm("-rf", `${webpackDir}/.gitignore`);
      // 修改 package.json的name
      const pkgDir = `${webpackDir}/package.json`;
      fs.readFile(pkgDir, "utf8", (err, data) => {
        if (err) throw err;
        let pkg = JSON.parse(data);
        pkg.name = projectName;
        pkg.version = "0.1.0";
        pkg.author = "";
        pkg.license = "";
        pkg = JSON.stringify(pkg, null, 2);
        fs.writeFileSync(pkgDir, pkg, "utf8", err => {
          if (err) console.log(err);
          process.exit();
        });
      });
      if (hasGit) {
        execPromise(`git clone ${projectGitUrl}`).then(() => {
          const projectDir = `${currentDir}/${projectName}`;
          shelljs.cp(`${webpackDir}/.babelrc`, `${projectDir}/`);
          shelljs.cp("-r", `${webpackDir}/public`, `${projectDir}/`);
          shelljs.cp("-r", `${webpackDir}/src`, `${projectDir}/`);
          shelljs.cp(`${webpackDir}/*`, `${projectDir}/`);
          shelljs.rm("-rf", webpackDir);
          if(checkCnpm){
            console.log(chalk.yellow("Try using cnpm install, please waiting..."));
            execPromise(`cd ${projectName} && cnpm install`).then(() => {
              endFun(projectName);
            });
          } else {
            console.log(chalk.yellow("Try using npm install, please waiting..."));
            execPromise(`cd ${projectName} && npm install`).then(() => {
              endFun(projectName)
            });
          }
        });
      } else {
        execPromise(`mv webpack-hot-demo ${projectName}`).then(() => {
          if(checkCnpm){
            console.log(chalk.yellow("try using cnpm install, please waiting..."));
            execPromise(`cd ${projectName} && cnpm install`).then(() => {
              endFun(projectName);
            });
          } else {
            console.log(chalk.yellow("try using npm install, please waiting..."));
            execPromise(`cd ${projectName} && npm install`).then(() => {
              endFun(projectName)
            });
          }
        });
      }
    });
  });
};
