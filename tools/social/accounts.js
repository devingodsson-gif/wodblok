// The accounts the post tool can publish to. Plain data, NO secrets: each account only names the GitHub secrets (environment variables) that hold its token.
// To add an account: add a line here, then add its secrets in GitHub (Settings > Secrets and variables > Actions) under exactly the names you write.
//   id         short name you type in the Run workflow "accounts" box (lowercase letters, numbers, dashes)
//   platform   which adapter publishes it: 'instagram' (more come later: facebook, x, tiktok)
//   tokenEnv   secret holding the access token
//   userIdEnv  secret holding the account's id on that platform
//   enabled    false to skip it without deleting the line
module.exports = [
  { id: 'wodblok-ig', platform: 'instagram', tokenEnv: 'WB_IG_TOKEN', userIdEnv: 'WB_IG_USER_ID', enabled: true },
];
