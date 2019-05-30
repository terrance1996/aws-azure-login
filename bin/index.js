#!/usr/bin/env node

"use strict";

process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

const commander = require("commander");

const configureProfileAsync = require("../lib/configureProfileAsync");
const CLIError = require("../lib/CLIError");
const login = require("../lib/login");

commander
    .option("--profile <name>", "The name of the profile to log in with (or configure)")
    .option("--configure", "Configure the profile")
    .option("--mode <mode>", "'cli' to hide the login page and perform the login through the CLI (default behavior), 'gui' to perform the login through the Azure GUI (more reliable but only works on GUI operating system), 'debug' to show the login page but perform the login through the CLI (useful to debug issues with the CLI login)")
    .option("--no-sandbox", "Disable the Puppeteer sandbox (usually necessary on Linux)")
    .option("--no-prompt", "Do not prompt for input and accept the default choice", false)
    .option("--enable-chrome-network-service", "Enable Chromium's Network Service (needed when login provider redirects with 3XX)")
    .option("--no-verify-ssl", "Disable SSL Peer Verification for connections to AWS (no effect if behind proxy)")
    .option("--enable-chrome-seamless-sso", "Enable Chromium's pass-through authentication with Azure Active Directory Seamless Single Sign-On")
    .parse(process.argv);

const profileName = commander.profile || process.env.AWS_PROFILE || "default";
const mode = commander.mode || 'cli';
const disableSandbox = !commander.sandbox;
const noPrompt = !commander.prompt;
const enableChromeNetworkService = commander.enableChromeNetworkService;
const awsNoVerifySsl = !commander.verifySsl;
const enableChromeSeamlessSso = commander.enableChromeSeamlessSso;

Promise.resolve()
    .then(() => {
        if (commander.configure) return configureProfileAsync(profileName);
        return login.loginAsync(profileName, mode, disableSandbox, noPrompt, enableChromeNetworkService, awsNoVerifySsl, enableChromeSeamlessSso);
    })
    .catch(err => {
        if (err.name === "CLIError") {
            console.error(err.message);
            process.exit(2);
        } else {
            console.log(err);
        }
    });
