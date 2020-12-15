import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
  // Parse the CLI args into an object
  const args = arg(
    {
      '--git': Boolean,
      '--yes': Boolean,
      '--install': Boolean,
      '--template': String,
      '-g': '--git',
      '-y': '--yes',
      '-i': '--install',
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  // Return the arguments object with defaults
  return {
    skipPrompts: args['--yes'] || false,
    git: args['--git'] || false,
    template: args['--template'] || 'TypeScript',
    runInstall: args['--install'] || false,
    folderName: args._[0],
  };
}

async function promptForMissingOptions(options) {
  if (options.skipPrompts) {
    return {
      ...options,
      folderName: 'expression-lib',
    };
  }

  const questions = [];
  if (!options.folderName) {
    questions.push({
      type: 'input',
      name: 'folderName',
      message: 'What is the name of the project?',
    });
  }

  if (!options.git) {
    questions.push({
      type: 'confirm',
      name: 'git',
      message: 'Initialize a git repository?',
      default: false,
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    git: options.git || answers.git,
    folderName: options.folderName || answers.folderName,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}
