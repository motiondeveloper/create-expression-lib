import chalk from "chalk";
import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import execa from "execa";
import Listr from "listr";
import { projectInstall } from "pkg-install";

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

async function initGit(options) {
  const result = await execa("git", ["init"], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error("Failed to initialize git"));
  }
  return;
}

async function updateProject(options) {
  const replaceFiles = ["README.md", "package.json"];
  const filePaths = replaceFiles.map((fileName) => {
    return path.join(options.targetDirectory, fileName);
  });

  for (const filePath of filePaths) {
    fs.readFile(filePath, "utf8", function (error, data) {
      if (error) {
        return console.error(
          "%s Error reading file:",
          filePath,
          chalk.red.bold("ERROR")
        );
      }
      const updatedContent = data.replace(
        /<project-name>/g,
        `${options.folderName || "Expression Library"}`
      );
      fs.writeFile(
        filePath,
        updatedContent,
        "utf8",
        (error) => error && console.log(error)
      );
    });
  }
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.folderName
      ? path.join(process.cwd(), options.folderName)
      : process.cwd(),
  };
  if (options.folderName) {
    fs.mkdirSync(options.folderName);
  }

  const currentFileUrl = import.meta.url;
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    "../../templates",
    options.template.toLowerCase()
  );
  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    console.error("%s Invalid template name", chalk.red.bold("ERROR"));
    process.exit(1);
  }

  const tasks = new Listr([
    {
      title: "Copy project files",
      task: () => copyTemplateFiles(options),
    },
    {
      title: "Update project",
      task: () => updateProject(options),
    },
    {
      title: "Initialize git",
      task: () => initGit(options),
      enabled: () => options.git,
    },
    {
      title: "Install dependencies",
      task: () =>
        projectInstall({
          cwd: options.targetDirectory,
        }),
      skip: () =>
        !options.runInstall
          ? "Pass --install to automatically install dependencies"
          : undefined,
    },
  ]);

  await tasks.run();
  console.log("%s Project ready", chalk.green.bold("DONE"));
  return true;
}
