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

const createElementTemplatesBundle = async (directory) => {
  try {
    const elementTemplatesBundle = path.join(directory, 'all.json');

    if (fs.existsSync(elementTemplatesBundle)) {
      fs.unlinkSync(elementTemplatesBundle);
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
    }

    const indexFilePath = path.join(directory, 'all.json');

    fs.writeFileSync(indexFilePath, JSON.stringify(jsonArray, null, 2));

    console.log('Element templates bundle created');
  } catch (error) {
    console.error('Error creating element templates bundle:', error);
  }
};

const repositoryUrl = 'https://github.com/camunda/web-modeler.git';
const temporaryDirectory = 'tmp';
const sourceDirectory = 'webapp/src/App/Pages/Diagram/BpmnJSExtensions/connectorsExtension/.camunda/element-templates';
const targetDirectory = 'test/fixtures/element-templates';

cloneRepository(repositoryUrl, temporaryDirectory);

copyFiles(path.join(temporaryDirectory, sourceDirectory), targetDirectory);

deleteDirectory(temporaryDirectory);

createElementTemplatesBundle(targetDirectory);