// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: (c) 2022, Michael Herwig <contact@michael-herwig.de>
'use strict';

const core = require('@actions/core');
const github = require('@actions/github');
const args = require('yargs').argv;

(async () => {
  try {
    core.notice(`${args.path}`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
})();
