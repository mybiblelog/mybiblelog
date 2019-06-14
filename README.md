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

Previously, it was necessary to set the `JDBC_DATABASE_URL` environment variable before running Gradle scripts like `gradle build` and `gradle check`.

This section of the `build.gradle` now handles that automatically:
```groovy
test {
	environment "JDBC_DATABASE_URL", "jdbc:h2:mem:testdb"
}
```

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
* Get the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables from Google
* Set up those variables in Eclipse to run the project locally
* Set up those variables in Heroku to deploy the project

## Connecting to Facebook OAuth2

To allow users to log in with their existing accounts you will need to follow several steps:
* Set up an OAuth2 app with the Facebook App Manager: https://developers.facebook.com/apps/
* Get the `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` environment variables from Facebook
	* Click the app name in the dashboard
	* In the left sidebar, click "Settings"
	* Under settings, click "Basic"
	* The "App ID" and "App Secret" are at the top of the page
* Note that you will also need to configure the **Valid OAuth Redirect URIs** for your app. These settings can be found under **Products > Settings** in the left sidebar.
	* The default redirect URI is: `https://www.mybiblelog.com/login/oauth2/code/facebook`

It is possible for Facebook OAuth2 users to withhold their email addresses during the login flow. This is problematic as user accounts and user data are centered around the email address as a unique identifier.

This situation is handled gracefully within the app. If you wish to test it by allowing/denying your Facebook email, you can delete this app from your personal Facebook permissions to start the login flow the beginning.
 
Personal OAuth2 dashboard: https://www.facebook.com/settings?tab=applications