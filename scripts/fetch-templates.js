/* eslint-env node */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

function cloneRepository(repositoryUrl, targetDirectory) {
  try {
    execSync(`git clone ${repositoryUrl} ${targetDirectory}`);

    console.log(`Repository cloned to ${targetDirectory}`);
  } catch (error) {
    console.error('Error cloning repository:', error.message);
  }
}

function copyFiles(sourceDirectory, targetDirectory) {
  try {
    fs.readdirSync(sourceDirectory).forEach(file => {
      const sourcePath = path.join(sourceDirectory, file);

      const targetPath = path.join(targetDirectory, file);

      fs.copyFileSync(sourcePath, targetPath);

      console.log(`Copied ${file} to ${targetDirectory}`);
    });
  } catch (error) {
    console.error('Error copying files:', error.message);
  }
}

function deleteDirectory(directory) {
  rimraf(directory, (error) => {
    if (error) {
      console.error('Error deleting directory:', error.message);
    } else {
      console.log(`Deleted ${directory}`);
    }
  });
}

const createTemplatesBundle = async (directory) => {
  try {
    const templatesBundle = path.join(directory, 'all.json');

    if (fs.existsSync(templatesBundle)) {
      fs.unlinkSync(templatesBundle);
    }

    const files = fs.readdirSync(directory);

    const jsonArray = [];

    for (const file of files) {
      const filePath = path.join(directory, file);

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const jsonObjectOrArray = JSON.parse(fileContent);

      if (Array.isArray(jsonObjectOrArray)) {
        jsonArray.push(...jsonObjectOrArray);
      } else {
        jsonArray.push(jsonObjectOrArray);
      }

      const indexFilePath = path.join(directory, 'all.json');

      fs.writeFileSync(indexFilePath, JSON.stringify(jsonArray, null, 2));

    }

    console.log('Templates bundle created');
  } catch (error) {
    console.error('Error creating templates bundle:', error);
  }
};

const repoUrl = 'https://github.com/camunda/web-modeler.git';
const destination = 'tmp';
const sourceDirectory = 'webapp/src/App/Pages/Diagram/BpmnJSExtensions/connectorsExtension/.camunda/element-templates';
const targetDirectory = 'test/fixtures/element-templates';

cloneRepository(repoUrl, destination);

copyFiles(path.join(destination, sourceDirectory), targetDirectory);

deleteDirectory(destination);

createTemplatesBundle(targetDirectory);