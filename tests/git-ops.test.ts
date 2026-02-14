import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
    hasChanges, 
    getChangedFiles, 
    createSnapshot, 
    commitChanges, 
    revertChanges, 
    createBranch, 
    getCurrentBranch, 
    getHeadSha
} from '../src/git-ops.js';
import { resolve } from 'node:path';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// Setup a temporary directory for running tests
const tempDir = resolve('temp-git-dir');

function createTestRepo() {
    fs.mkdir(tempDir, { recursive: true });
    spawnSync('git', ['init'], { cwd: tempDir });
}

async function cleanUpTestRepo() {
    await fs.rm(tempDir, { recursive: true, force: true });
}

describe('Git Operations Module', () => {
    beforeEach(async () => {
        await cleanUpTestRepo();
        createTestRepo();
    });

    it('should detect no changes in a new repository', async () => {
        const changes = await hasChanges(tempDir);
        assert.strictEqual(changes, false);
    });

    it('should handle git command failure (non-existing command)', async () => {
        // Simulate a failure by running an invalid git command.
        const result = await createBranch(tempDir, 'invalid-branch-name');
        assert.strictEqual(result.success, false);
        assert(result.error);
    });

    it('should get an empty list of changed files in a new repo', async () => {
        const changedFiles = await getChangedFiles(tempDir);
        assert.deepStrictEqual(changedFiles, []);
    });

    it('should create and retrieve a snapshot in a repo with changes', async () => {
        await fs.writeFile(resolve(tempDir, 'file.txt'), 'content');
        const snapshot = await createSnapshot(tempDir);
        assert(snapshot);
        const changes = await hasChanges(tempDir);
        assert.strictEqual(changes, true);
    });

    it('should revert changes in the working tree', async () => {
        await fs.writeFile(resolve(tempDir, 'file.txt'), 'content');
        const snapshot = await createSnapshot(tempDir);
        const revertResult = await revertChanges(tempDir);
        assert.strictEqual(revertResult.success, true);
        const changes = await hasChanges(tempDir);
        assert.strictEqual(changes, false);
    });

    it('should create a branch and return success', async () => {
        const result = await createBranch(tempDir, 'test-branch');
        assert.strictEqual(result.success, true);
    });

    it('should get the current branch name', async () => {
        await createBranch(tempDir, 'main');
        const branchName = await getCurrentBranch(tempDir);
        assert.strictEqual(branchName, 'main');
    });

    it('should get the short SHA of HEAD', async () => {
        // Commit a change to get a valid HEAD
        await fs.writeFile(resolve(tempDir, 'file.txt'), 'content');
        await commitChanges(tempDir, 'Initial commit');
        const sha = await getHeadSha(tempDir);
        assert.strictEqual(sha.length, 7); // Git short SHA length is 7
    });
});
