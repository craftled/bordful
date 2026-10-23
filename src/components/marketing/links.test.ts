import { expect, test } from "vitest";

import { DEPLOY_URL } from "./links";

const CONTRACT_DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Ftree%2Fv1&project-name=bordful&repository-name=bordful&env=PAYLOAD_SECRET%2CCRON_SECRET&envDescription=PAYLOAD_SECRET%20signs%20admin%20sessions%20(32%2B%20random%20characters).%20CRON_SECRET%20guards%20the%20cron%20routes.&envLink=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Fblob%2Fv1%2Fdocs%2Fdeploy.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D";

test("deploy URL matches the shared contract", () => {
  expect(DEPLOY_URL).toBe(CONTRACT_DEPLOY_URL);

  const params = new URL(DEPLOY_URL).searchParams;
  expect(params.get("repository-url")).toBe(
    "https://github.com/craftled/bordful/tree/v1"
  );
  expect(params.get("env")).toBe("PAYLOAD_SECRET,CRON_SECRET");
});
