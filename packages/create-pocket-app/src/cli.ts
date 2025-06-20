#!/usr/bin/env node

import chalk from "chalk";
import { existsSync } from "fs";
import { cp, mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import prompts from "prompts";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const onCancel = () => {
    console.log(chalk.yellow("\nOperation cancelled"));
    process.exit(0);
  };

  const { directoryName } = await prompts(
    {
      type: "text",
      name: "directoryName",
      message: "Directory name:",
      initial: "pocket-app",
    },
    { onCancel },
  );

  if (!directoryName) {
    console.error(chalk.red("\nDirectory name is required."));
    process.exit(1);
  }

  const defaultProjectName = directoryName.trim().toLowerCase().replace(/\s+/g, "-");

  const { projectName } = await prompts(
    {
      type: "text",
      name: "projectName",
      message: "Package name:",
      initial: defaultProjectName,
      validate: (value) => {
        if (!value) {
          return "Package name is required";
        }

        if (value.length > 214) {
          return "Package name is too long";
        }

        if (value.startsWith(".") || value.startsWith("_")) {
          return "Package name cannot start with a dot or underscore";
        }

        if (value.includes("..")) {
          return "Package name cannot contain consecutive dots";
        }

        if (!/^[a-z0-9-_.]+$/.test(value)) {
          return "Package name can only contain lowercase letters, numbers, hyphens, underscores, and dots";
        }

        return true;
      },
    },
    { onCancel },
  );

  const targetPath = resolve(process.cwd(), directoryName);
  const templatePath = join(__dirname, "../template");

  if (existsSync(targetPath)) {
    console.error(chalk.red(`\nDirectory '${directoryName}' already exists.`));
    process.exit(1);
  }

  try {
    await mkdir(targetPath, { recursive: true });
    await cp(templatePath, targetPath, { recursive: true });

    const ignoreSourcePath = join(targetPath, "gitignore");
    const ignoreDestinationPath = join(targetPath, ".gitignore");
    const environmentPath = join(targetPath, ".env.local");
    const packageJsonPath = join(targetPath, "package.json");

    const packageJsonContent = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    packageJson.name = projectName;

    await rename(ignoreSourcePath, ignoreDestinationPath);
    await writeFile(environmentPath, "OPENAI_API_KEY=\n");
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  } catch (error) {
    console.error(
      chalk.red("\nFailed to create project:"),
      error instanceof Error ? error.message : String(error),
    );

    process.exit(1);
  }

  console.log(`\n${chalk.green("Success!")} Created ${chalk.bold(projectName)} at: ${targetPath}\n`);

  console.log(chalk.blue.bold("Important:\n"));
  console.log("  An .env.local file has been created.");
  console.log("  You must add your OpenAI API key before running the app.\n");

  console.log(chalk.blue.bold("Next steps:\n"));
  console.log(`  cd ${directoryName}`);
  console.log("  npm install");
  console.log("  npm run dev\n");

  console.log(chalk.cyan("Remember to edit .env.local and add your OpenAI API key.\n"));
}

main().catch((error) => {
  console.error(chalk.red("\nUnexpected error:"), error instanceof Error ? error.message : String(error));
  process.exit(1);
});
