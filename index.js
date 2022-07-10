// // SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: (c) 2022, Michael Herwig <contact@michael-herwig.de>
'use strict';

const core = require('@actions/core');
const github = require('@actions/github');
const args = require('yargs').argv;
const fs = require('fs');
const path = require('node:path');
const plist = require('plist');

async function collectPlistFiles(dir) {
  return await fs.promises.readdir(dir)
    .catch(_ => { return []; })
    .then(async files => {
      return await Promise.all(files.map(async file => {
        const filepath = path.join(dir, file);
        const filestats = await fs.promises.stat(filepath);
        if (filestats.isFile()) {
          if (filepath.endsWith('.plist')) {
            return [filepath];
          }
        } else if (filestats.isDirectory()) {
          return await collectPlistFiles(filepath);
        }
        return [];
      })).then(filelists => { return filelists.flat(); });
    });
}

async function importPlist(file) {
  return await fs.promises.readFile(file, { encoding: 'utf8' }).then(async content => {
    const { files, diagnostics } = plist.parse(content);
    return diagnostics.map(diagnostic => {
      return {
        path: files[diagnostic.location.file],

        start_line: diagnostic.location.line,
        end_line: diagnostic.location.line,
        start_column: diagnostic.location.col,
        end_column: diagnostic.location.col,

        annotation_level: 'failure',
        message: diagnostic.description,
        title: `${diagnostic.category}: ${diagnostic.check_name}`
      }
    });
  });
}

(async () => {
  try {
    const itoken = args.token;
    const ipath = args.path;

    const octokit = github.getOctokit(args.token);
    const checkrun = await octokit.rest.checks.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      head_sha: github.context.sha,

      name: 'Cppcheck',
      status: 'in_progress',

      output: {
        title: `TODO Small Feedback`,
        summary: `TODO Build small summary!`
      }
    });
    const checkrun_id = checkrun.data.id;

    const files = await collectPlistFiles(ipath);
    core.info(`Found ${files.length} .plist files:\n - ${files.join('\n - ')}`);
    const annotations = await Promise.all(files.map(async (file) => {
      return await importPlist(file);
    })).then(annotations => { return annotations.flat(); });
    core.info(`Found ${annotations.length} annotations:\n - ${annotations.map(annotation => annotation.title).join('\n - ')}`);

    var uploads = [];
    const max_annotations = 50;
    for (var i = 0; i < annotations.length; i += max_annotations) {
      const size = Math.min(max_annotations, annotations.length - i);
      const batch = annotations.slice(i, i + size);

      uploads.push(octokit.rest.checks.update({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        check_run_id: checkrun_id,

        output: {
          annotations: batch
        }
      }));
    }
    await Promise.all(uploads);

    const conclusion = files.length > 0 ? (annotations.length > 0 ? 'failure' : 'success') : 'skipped';
    await octokit.rest.checks.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      check_run_id: checkrun_id,

      status: 'completed',
      conclusion: conclusion
    });
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();
