#!/usr/bin/env node

process.on("SIGINT", () => process.exit(1));
process.on("SIGTERM", () => process.exit(1));

import { Command } from "commander";
import { configureProfileAsync } from "./configureProfileAsync";
import { login } from "./login";

const program = new Command();

program
  .option("-p, --profile", "profile")
  .option(
    "-p, --profile <name>",
    "The name of the profile to log in with (or configure)"
  )
  .option("-a, --all-profiles", "Run for all configured profiles")
  .option(
    "-f, --force-refresh",
    "Force a credential refresh, even if they are still valid"
  )
  .option("-c, --configure", "Configure the profile")
  .option(
    "-m, --mode <mode>",
    "'cli' to hide the login page and perform the login through the CLI (default behavior), 'gui' to perform the login through the Azure GUI (more reliable but only works on GUI operating system), 'debug' to show the login page but perform the login through the CLI (useful to debug issues with the CLI login)"
  )
  .option(
    "--no-sandbox",
    "Disable the Puppeteer sandbox (usually necessary on Linux)"
  )
  .option(
    "--no-prompt",
    "Do not prompt for input and accept the default choice",
    false
  )
  .option(
    "--enable-chrome-network-service",
    "Enable Chromium's Network Service (needed when login provider redirects with 3XX)"
  )
  .option(
    "--no-verify-ssl",
    "Disable SSL Peer Verification for connections to AWS (no effect if behind proxy)"
  )
  .option(
    "--enable-chrome-seamless-sso",
    "Enable Chromium's pass-through authentication with Azure Active Directory Seamless Single Sign-On"
  )
  .option(
    "--no-disable-extensions",
    "Tell Puppeteer not to pass the --disable-extensions flag to Chromium"
  )
  .parse(process.argv);

const profileName =
  (program.profile as string | undefined) ||
  process.env.AWS_PROFILE ||
  "default";
const mode = (program.mode as string | undefined) || "cli";
const disableSandbox = !program.sandbox;
const noPrompt = !program.prompt;
const enableChromeNetworkService = !!program.enableChromeNetworkService;
const awsNoVerifySsl = !program.verifySsl;
const enableChromeSeamlessSso = !!program.enableChromeSeamlessSso;
const forceRefresh = !!program.forceRefresh;
const noDisableExtensions = !program.disableExtensions;

Promise.resolve()
  .then(() => {
    if (program.allProfiles) {
      return login.loginAll(
        mode,
        disableSandbox,
        noPrompt,
        enableChromeNetworkService,
        awsNoVerifySsl,
        enableChromeSeamlessSso,
        forceRefresh,
        noDisableExtensions
      );
    }

    if (program.configure) return configureProfileAsync(profileName);
    return login.loginAsync(
      profileName,
      mode,
      disableSandbox,
      noPrompt,
      enableChromeNetworkService,
      awsNoVerifySsl,
      enableChromeSeamlessSso,
      noDisableExtensions
    );
  })
  .catch((err: Error) => {
    if (err.name === "CLIError") {
      console.error(err.message);
      process.exit(2);
    } else {
      console.log(err);
    }
  });
