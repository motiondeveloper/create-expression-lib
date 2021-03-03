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
  // Replace project name in these files
  // with the folder name from the CLI
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

  // Rename gitignore to .gitignore to fix npm killing it:
  // https://github.com/npm/npm/issues/3763
  const renameFiles = [{ from: "gitignore", to: ".gitignore" }];
  const renamePaths = renameFiles.map(({ from, to }) => {
    return {
      from: path.join(options.targetDirectory, from),
      to: path.join(options.targetDirectory, to),
    };
  });
  for (const { from, to } of renamePaths) {
    fs.rename(
      from,
      to,
      (error) => error && console.log(`%s${error}`, chalk.red.bold("ERROR"))
    );
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

  const templateDir = path.resolve(
    __dirname,
    "../templates",
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
