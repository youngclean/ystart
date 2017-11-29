"use strict";
const exec = require("child_process").exec;
const co = require("co");
const prompt = require("co-prompt");
const config = require("../config");
const chalk = require("chalk");
const shelljs = require("shelljs");
const fs = require("fs");

function execPromise(command) {
  return new Promise((resolve, reject) => {
    console.log("start to exec commands:");
    console.log(command);
    console.log("------------");
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

module.exports = () => {
  co(function*() {
    // 处理用户输入
    const projectName = yield prompt("Project name: ");
    const gitUrl =
      "https://github.com/youngclean/webpack-hot-demo.git";

    // 避免重复添加
    if (!config.project[projectName]) {
      config.project[projectName] = {};
      config.project[projectName]["name"] = projectName;
    } else {
      console.log(chalk.red("Project has already existed!"));
      process.exit();
    }
    // 修改download下来的仓库名为项目目录名
    const cmdStr = `git clone ${gitUrl} && mv webpack-hot-demo ${projectName}`;

    console.log(chalk.white("\n Start generating..."));

    execPromise(cmdStr).then(() => {
      const currentDir = shelljs.pwd();
      const projectDir = `${currentDir}/${projectName}`;
      // 删除git信息
      shelljs.rm("-rf", `${projectDir}/.git`);
      console.log(chalk.green("\n √ Generation completed!"));
      console.log(`\n cd ${projectName} && npm install || cnpm install \n`)
      process.exit();
    });
  });
};
