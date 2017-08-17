#!/usr/bin/env node

'use strict';

const fs                    = require('fs');
const os                    = require('os');
const npmlog                = require('npmlog');
const nopt                  = require('nopt');
const path                  = require('path');
const knownOpts             = { 'setup'         : Boolean,
                                'parse'         : Boolean,
                                'fig-file'      : path,
                                'file-content'  : String,
                                'gitignore-skip': Boolean,
                                'gitignore-path': path};
const shorthands            = { 's' : ['--setup'],
                                'p' : ['--parse'],
                                '?' : ['--help'],
                                'h' : ['--help'],
                                'ff': ['--fig-file'],
                                'fc': ['--fig-content'],
                                'gs': ['--gitignore-skip'],
                                'gp': ['--gitignore-path'],
                                'v' : ['--version']};
const options               = nopt(knownOpts, shorthands);

const eol                   = os.platform ? (os.platform() === 'win32' ? '\r\n' : '\n') : '\n';
exports.eol                 = eol;

const figDefaultContent     = '{}';
exports.figDefaultContent   = figDefaultContent;

const figDefaultFilePath    = 'fig.json';
exports.figDefaultFilePath  = figDefaultFilePath;

npmlog.heading              = 'fig';

console.log('\n _____   ___    ____\n|  ___| |_ _|  / ___|\n| |_     | |  | |  _ \n|  _|    | |  | |_| |\n|_|     |___|  \\____|\n');

/* CLI to print the current version of fig */
if (options.version) {
    npmlog.info('version ' + require('./package.json').version);
    process.exit(0);
}

/* CLI to print the help command-line tools for fig */
if (options.help) {
    console.log(function () {/*
     Usage:
     fig <command> <options>

     Manages your project sensitive configuration (e.g.: the settings that you do not want to upload to git).

     Commands:
     --setup, -s            Creates the fig file where your sensitive configuration will be stored and adds it to your .gitignore.
     --parse, -p            Parses the content of fig file and adds it to process.env

     Options:
     --fig-file, -ff        File where your sensitive configuration will be stored, default: fig.json
     --gitignore-skip, -gs  Skips updating .gitignore file, default: false
     --gitignore-path, -gp  Path for the .gitignore file default: .gitignore
     --version, -v          Print the version of fig.
     --help, -h             Print fig help.

     Please report bugs!  https://github.com/Amay22/fig/issues

     */
    }.toString().split(/\n/).slice(1, -2).join('\n'));
    process.exit(0);
}

/* CLI to setup the fig.json file in the current directory */
if (options.setup) {
    setup(options['fig-file'],  options['gitignore-skip'], options['gitignore-path'], options['gitignore-skip']);
    process.exit(0);
}

/* Export the setup function for external call to create fig.json file by clients */
exports.setup = function (figFilePath, figFileJSONContents, gitIgnorePath, skipGitIgnore) {
    setup (figFilePath, figFileJSONContents, gitIgnorePath, skipGitIgnore);
};

/* */
function setup (figFilePath, figFileJSONContents, gitIgnorePath, skipGitIgnore) {
    figFilePath         = figFilePath         || figDefaultFilePath;
    figFileJSONContents = figFileJSONContents || figDefaultContent;
    gitIgnorePath       = gitIgnorePath       || '.gitignore';
    skipGitIgnore       = skipGitIgnore       || false;

    if (fs.existsSync(figFilePath)) {
        npmlog.warn(figFilePath + ' already exists, we will not overwrite');
    } else {
        npmlog.info('Creating ' + figFilePath);
        fs.writeFileSync(figFilePath, figFileJSONContents);
    }
    if (!skipGitIgnore) {
        fs.existsSync(gitIgnorePath) ? appendToGitIgnoreFile(gitIgnorePath, figFilePath) : createGitIgnoreFile(gitIgnorePath, figFilePath);
    }
}

function createGitIgnoreFile(gitIgnorePath, gitIgnoreContents) {
    npmlog.info('creating .gitignore and adding ' + gitIgnoreContents);
    fs.writeFileSync(gitIgnorePath, eol + gitIgnoreContents + eol);
}

function appendToGitIgnoreFile(gitIgnorePath, gitIgnoreContents) {
    if (alreadyAppendedToGitIgnoreFile(gitIgnorePath, gitIgnoreContents)) {
        npmlog.info('.gitignore already ignores ' + gitIgnoreContents);
    } else {
        npmlog.info('adding to .gitignore ' + gitIgnoreContents);
        const fd = fs.openSync(gitIgnorePath, 'a', null);
        fs.writeSync(fd, eol + gitIgnoreContents + eol, null, 'utf8');
        fs.close(fd);
    }
}

function alreadyAppendedToGitIgnoreFile(gitIgnorePath, gitIgnoreContents) {
    return fs.readFileSync(gitIgnorePath, 'utf8').indexOf(gitIgnoreContents) !== -1;
}





if (options.parse) {
    parse (options['fig-file'], null);
}

exports.parse = function (figFilePath, callback) {
    parse(figFilePath, callback);
};

/* parses the fig.json file and loads the variables into the environment */
function parse (figFilePath, callback) {
    figFilePath = figFilePath || figDefaultFilePath;

    /* read the file */
    fs.readFile(figFilePath, 'utf8', function (error, data) {
        if (error) {
            npmlog.error(error);
            callback(error)
            return;
        }
        let figJSON = JSON.parse(data);
        /* json parse */
        for (let key in figJSON) {
            npmlog.info("Added " + key + " to the environment");
            process.env[key] = figJSON[key];
        }
    });
}
