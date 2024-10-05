const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);

    const { payload } = github.context;
    const newPRNumber = payload.pull_request.number;
    const author = payload.pull_request.user.login;

    await checkMultiplePRs(octokit, author, newPRNumber);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function checkMultiplePRs(octokit, author, newPRNumber) {
  const { data: pulls } = await octokit.rest.pulls.list({
    ...github.context.repo,
    state: 'open',
    creator: author
  });

  if (pulls.length > 1) {
    const otherPRs = pulls.filter(pr => pr.number !== newPRNumber);
    if (otherPRs.length > 0) {
      const prNumbers = otherPRs.map(pr => pr.number).join(', ');
      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: newPRNumber,
        body: `⚠️ 注意: @${author} さんの作業中の他のPRがあります (PR numbers: ${prNumbers})。並行作業にご注意ください。`
      });
    }
  }
}

run();