[Environments](#environments)
[Run](#run)
[Release build](#release)

# Environments

Harvest collecter application supports multi environments: 

- **Production**
- **Development**

You must add environment configurations to run the project. It must written in corresponding .env.development and .env.production files.

These env files includes configuaration variables for each environment.

Create 2 files .env.development and .env.production if you haven't already and add configuaration variables into these files.

Examples for the configuration variables can be foun in the [.env.template](.env.template) file.

You can also crete other environments if you like. You can follow the package [react-native-config](https://www.npmjs.com/package/react-native-config/v/1.4.11) for more reference.

# Run

Before running, please make sure that you are completed all the installations and followed environment setups that mentioned above.

## Run production mode

To run production mode, you can run these commands from the project root.

`yarn start` to start Metro Bundler.

`yarn run-prod`

## Run development mode

To run production mode, you can run these commands from the project root.

`yarn start` to start Metro Bundler.

`yarn run-dev`


# Release build

If you want to clear previous build before building new one, run

`yarn clean` from the project root.

To create release build run these cammand from the project root.

## Release production build

`yarn apk-prod` for .apk build.

`yarn aab-prod` for .aab build.

## Release development build

`yarn apk-dev` for .apk build.
