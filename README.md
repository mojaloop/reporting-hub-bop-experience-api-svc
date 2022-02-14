## Mojaloop Finance Portal Experience API
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/reporting-fin-portal-experience-svc.svg?style=flat)](https://github.com/mojaloop/reporting-fin-portal-experience-svc/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/reporting-fin-portal-experience-svc.svg?style=flat)](https://github.com/mojaloop/reporting-fin-portal-experience-svc/releases)
[![CircleCI](https://circleci.com/gh/mojaloop/reporting-fin-portal-experience-svc.svg?style=svg)](https://circleci.com/gh/mojaloop/reporting-fin-portal-experience-svc)

## Introduction

This is an API for finance portal which is a part of the [Business Operations Framework](https://docs.mojaloop.io/mojaloop-business-docs/).

## Runtime Configuration

Runtime configuration is handled by `rc`, and can be specified using either Environment Variables, or a `.json` file.

See [`./config/default.json`](./config/default.json) for an example config file.

When setting configuration using environment variables, the `FIN_PORTAL_EXPERIENCE_SERVICE` environment variable prefix is required.

For example to set a configuration variable 'ORY_KETO_READ_SERVICE_URL', we need to pass the environment variable like this `FIN_PORTAL_EXPERIENCE_SERVICE_ORY_KETO_READ_SERVICE_URL`.

See [`src/shared/config.ts`](src/shared/config.ts) to understand how these variables are configured.

### Key Config Options

| Variable Name | Description | Default Value |
| -------------------- | ----------- | ------ |
| CENTRAL_ADMIN_URL | Central Admin Service URL | http://central-ledger:3001
| CENTRAL_SETTLEMENTS_URL | Central Settlements Service URL | http://central-settlements:3001


> ***Note:** See [`./config/default.json`](./config/default.json) for all available config options, and their default values.*

## Setup for developer

### Clone repo
```bash
git clone git@github.com:mojaloop/reporting-fin-portal-experience-svc.git
```

### Install service dependencies
```bash
cd reporting-fin-portal-experience-svc
npm ci
```

### Run the service with NPM locally
```bash
npm run startDev
```
