// we created this database manually in the dashboard
const mysql = planetscale.getDatabaseOutput({
  name: "[[PLANETSCALE_DATABASE_NAME]]",
  organization: "[[PLANETSCALE_ORGANIZATION_NAME]]",
});

const branch =
  $app.stage !== "production"
    ? new planetscale.Branch("DatabaseBranch", {
        database: mysql.name,
        organization: mysql.organization,
        name: $app.stage,
        parentBranch: "main",
      })
    : planetscale.getBranchOutput({
        name: "main",
        organization: mysql.organization,
        database: mysql.name,
      });

const password = new planetscale.Password("DatabasePassword", {
  database: mysql.name,
  organization: mysql.organization,
  branch: branch.name,
  role: "admin",
  name: `${$app.name}-${$app.stage}-credentials`,
});

export const database = new sst.Linkable("Database", {
  properties: {
    username: password.username,
    host: branch.mysqlAddress,
    password: password.plaintext,
    database: password.database,
    port: 3306,
  },
});
