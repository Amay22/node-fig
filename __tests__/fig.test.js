const fs          = require('fs');
const fig         = require('../index');
const npmlog      = require('npmlog');
const assert      = module.exports = require('assert');

function isFile(path) {
    const stats = fs.lstatSync(path);
    assert.ok(stats);
    assert.ok(stats.isFile());
}
assert.isFile = isFile;

function fileContentsEqual(path, expectedContents) {
    assert.equal(fs.readFileSync(path, 'utf8'), expectedContents);
}
assert.fileContentsEqual = fileContentsEqual;

function fileCreatedWithContents(path, contents) {
    assert.isFile(path);
    assert.fileContentsEqual(path, contents);
}
assert.fileCreatedWithContents = fileCreatedWithContents;

npmlog.level = 'silent';

const figFilePath = './__tests__/new_file.json';
const figFilePathTest = './__tests__/fig_test.json';
const figFilePathDoesNotExist = './__tests__/does_not_exist.json';
const figFileJSONContents = '{ "test": "a" }';
const gitIgnorePath = './__tests__/.gitignore.test';
const gitIgnoreContents = 'sometext';

function isFile(path) {
    const stats = fs.lstatSync(path);
    assert.ok(stats);
    assert.ok(stats.isFile());
}
assert.isFile = isFile;

function fileContentsEqual(path, expectedContents) {
    assert.equal(fs.readFileSync(path, 'utf8'), expectedContents);
}
assert.fileContentsEqual = fileContentsEqual;

function fileCreatedWithContents(path, contents) {
    assert.isFile(path);
    assert.fileContentsEqual(path, contents);
}
assert.fileCreatedWithContents = fileCreatedWithContents;

describe('fig', () => {
    describe('#setup', () => {
        it('should setup a new fig json file', () => {
            fig.setup(figFilePath, figFileJSONContents, gitIgnorePath, true);

            assert.fileCreatedWithContents(figFilePath, figFileJSONContents);
            fs.unlinkSync(figFilePath);
        });

        it('should setup a new fig json file with default contents', () => {
            fig.setup(figFilePath, null, gitIgnorePath, true);

            assert.fileCreatedWithContents(figFilePath, fig.figDefaultContent);
            fs.unlinkSync(figFilePath);
        });

        it('should not overwrite existing fig json file', () => {
            const existingContents = '{ "test": "b" }';
            fs.writeFileSync(figFilePath, existingContents);

            fig.setup(figFilePath, null, gitIgnorePath, true);

            assert.fileContentsEqual(figFilePath, existingContents);
            fs.unlinkSync(figFilePath);
        });

        it('should setup a new fig json file with default contents and create a new git ignore file', () => {
            fig.setup(figFilePath, null, gitIgnorePath, false);

            assert.fileCreatedWithContents(figFilePath, fig.figDefaultContent);
            fs.unlinkSync(figFilePath);
            assert.fileCreatedWithContents(gitIgnorePath, fig.eol + figFilePath + fig.eol);
            fs.unlinkSync(gitIgnorePath);
        });

        it('should not re-append if it already appears in existing git ignore file', () => {
            fig.setup(figFilePath, null, gitIgnorePath, false);
            fig.setup(figFilePath, null, gitIgnorePath, false);

            assert.fileCreatedWithContents(figFilePath, fig.figDefaultContent);
            fs.unlinkSync(figFilePath);
            assert.fileCreatedWithContents(gitIgnorePath, fig.eol + figFilePath + fig.eol);
            fs.unlinkSync(gitIgnorePath);
        });

        it('should append if it does not appear in existing git ignore file', () => {
            fs.writeFileSync(gitIgnorePath, gitIgnoreContents);
            fig.setup(figFilePath, null, gitIgnorePath, false);

            assert.fileCreatedWithContents(figFilePath, fig.figDefaultContent);
            fs.unlinkSync(figFilePath);
            assert.fileCreatedWithContents(gitIgnorePath, gitIgnoreContents + fig.eol + figFilePath + fig.eol);
            fs.unlinkSync(gitIgnorePath);
        });
    });

    describe('#parse', () => {
        it('should not find fig json file', (done) => {
            fig.parse(figFilePathDoesNotExist, function (error) {
                assert.ok(error);
                assert.ok(!process.env['TEST1']);
                assert.ok(!process.env['TEST2']);
                done();
            });
        });

        it('should add fig entries to process.env', () => {
            fig.setup(figFilePath, figFileJSONContents, null, true);
            fig.parse(figFilePathTest, function (error) {
                assert.ok(!error);
                assert.equal(process.env['test'], 'a');
                done();
            });
            fs.unlinkSync(figFilePath);
        });
    });
});