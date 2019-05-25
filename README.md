# MyBibleLog.com

[![Build Status](https://travis-ci.com/mybiblelog/mybiblelog.svg?branch=master)](https://travis-ci.com/mybiblelog/mybiblelog)

This repository contains the code that runs [mybiblelog.com](http://www.mybiblelog.com/).

## Developing in Eclipse

The `application.properties` file in `mybiblelog/src/main` sets a `spring.datasource.url` property. This property comes directly from the environment variable `JDBC_DATABASE_URL`. Therefore, that environment variable must be provided when running and testing the application in Eclipse.

To configure these properties, right click the project. Under `Run As`, click `Run Configurations`.

In the left column, select `Java Application > Application`. In the Environment tab on the right, add a new variable:
* Variable: `JDBC_DATABASE_URL`
* Value: `jdbc:h2:file:~/mybiblelog_db;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE`

You will also need to add values for `CLIENT_ID` and `CLIENT_SECRET` to enable OAuth2 with Google.

In the left column, select `JUnit > mybiblelog`. (If there is no `mybiblelog` under `JUnit`, right-click `JUnit` and select `New Configuration`.) In the environment tab add this variable:
* Variable: `JDBC_DATABASE_URL`
* Value: `jdbc:h2:mem:testdb`

This will ensure correct database access for three different environments:
1. Tests will run isolated in-memory with H2
2. Development of the application will use a persisted H2 database
3. Heroku can configure the connection when the app is deployed to production

## Developing on Windows

These notes apply to developing and testing in the terminal on Windows.

On Windows, a modified Procfile must be used to run the application locally: `heroku local web -f procfile.windows`

## Building with Gradle

Before running `gradle build` in the local terminal, you must run `export JDBC_DATABASE_URL=jdbc:h2:mem:testdb` to set the environment variable. Otherwise tests will fail.

## Working with Postgres

The Heroku Postgres dashboard provides limited and occasionally outdated information about the provisioned database. For example, it might not display the actual number of rows among all tables. It also offers limited interaction with the database.

Fortunately, it is possible to interact with a Heroku-provisioned Postgres database from the local terminal. Simply run `heroku pg:psql` to get an interactive SQL terminal.

**NOTE:** This does require Postgres to be installed on the local machine.

```sql
-- Show each table and number of rows in each
SELECT schemaname, relname, n_live_tup 
  FROM pg_stat_user_tables 
  ORDER BY n_live_tup DESC;

-- Count total number of rows in database
SELECT SUM(n_live_tup) FROM pg_stat_user_tables;
```

## Connecting to Google OAuth2

To allow users to log in with their existing user accounts you will need to follow several steps:
* Set up an OAuth2 client with the Google credentials manager: https://console.developers.google.com/apis/credentials/oauthclient/
* Ensure all relevant hosts are set as allowed Google redirect URLs:
	* http://localhost:8080/login/oauth2/code/google
	* http://www.mybiblelog.com/login/oauth2/code/google
	* http://mybiblelog.herokuapp.com/login/oauth2/code/google
* Get the `CLIENT_ID` and `CLIENT_SECRET` environment variables from Google
* Set up those variables in Eclipse to run the project locally
* Set up those variables in Heroku to deploy the project
