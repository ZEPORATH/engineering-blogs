---
title: "Steps to Deploy Frontend on AWS"
date: 2026-01-08
categories:
  - Deployment
---
[Main Readme](./../README.md)
## Steps to deploy our frontend on AWS

1. Go AWS dashboard and select:
   - `Console Home > All Services > AWS AppRunner`

   ![AWS AppRunner Dashboard](./../assets/screenshots/CreateServiceAwsAppRunner.png)

2. In AWS AppRunner Dashboard:
   - Create a Service

3. In Create Service Form:
   - Select Source as **Source Code Repository**
   - Select Provider as **GitHub**
   - Add a GitHub connection to your repo and select the branch
     - Adding a new GitHub connection will need access to your GitHub account in the same browser. Just approval by admin doesn’t work.
     - You will need to allow AWS connector app to be installed on your github
   - Deployment settings should be selected to **Automatic**
   - Go Next

4. In Configure Build:
   - Select **Configure All settings here**, as we do not have the `apprunner.yaml` file in our project.
   - Choose AppRunner Runtime as **Node.js 20**
   - Build command: `npm install && npm build`
   - Start command: `npm run`
   - Port: **5000** (as our app runs on 5000)

   ![Configure Build in AWS AppRunner](./../assets/screenshots/ConfigureBuildAwsAppRunner.png)

5. In Configure Service:
   - Leave settings as is
   - Just give the service a name
   - Press Next

6. In Review and Create:
   - Do nothing, just check the parameters added and then hit **Create & Deploy**.
