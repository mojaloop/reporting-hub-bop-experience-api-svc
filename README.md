## Mojaloop Business Operations Framework Experience API 
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/reporting-hub-bop-experience-api-svc.svg?style=flat)](https://github.com/mojaloop/reporting-hub-bop-experience-api-svc/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/reporting-hub-bop-experience-api-svc.svg?style=flat)](https://github.com/mojaloop/reporting-hub-bop-experience-api-svc/releases)
[![CircleCI](https://circleci.com/gh/mojaloop/reporting-hub-bop-experience-api-svc.svg?style=svg)](https://circleci.com/gh/mojaloop/reporting-hub-bop-experience-api-svc)

## Introduction

This is an API for experience layer which is a part of the [Business Operations Framework](https://docs.mojaloop.io/mojaloop-business-docs/).

## Runtime Configuration

Runtime configuration is handled by `rc`, and can be specified using either Environment Variables, or a `.json` file.

See [`./config/default.json`](./config/default.json) for an example config file.

When setting configuration using environment variables, the `BOP_EXPERIENCE_API` environment variable prefix is required.

For example to set a configuration variable 'ORY_KETO_READ_SERVICE_URL', we need to pass the environment variable like this `BOP_EXPERIENCE_API_ORY_KETO_READ_SERVICE_URL`.

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
git clone git@github.com:mojaloop/reporting-hub-bop-experience-api-svc.git
```

### Install service dependencies
```bash
cd reporting-hub-bop-experience-api-svc
npm ci
```

### Run the service with NPM locally
```bash
npm run startDev
```
