## Harvest mobile application

With Harvest the the brand can offer premium or special prices to the farmers in their supply chain. 
We are trying to enable a secure legitimate way for these brands to reach the end farmers in the supply chain and distribute the premium to them.

The application can do 3 major functionalities:

 *  Add new farmers to the platform
 *  Transfer stock
 *  Verify the premium transaction

The user can do these functionalities without the internet and able to sync them with the server when they are connected to the network.

Powered by: React Native and React


## Documentation
You can find the more details and Documentation about the application in the [Confluence page][documentation]


## Quick start

You must install all the react native requirements before installing this project.
React native installation guide can be found [here][react_native_setup].

Also need to install yarn package manager.

```
1. git clone git@git.cied.in:fairfood/trace-v2/frontend-mobile/fairfood-react-native.git
2. cd fairfood-react-native
3. yarn install
4. npx react-native link
```


## Running the project

You can follow the steps from [DEV_DOCS](DEV_DOCS.md) for running the project.


## Main dependencies

- [react](https://github.com/facebook/react)
- [react-native](https://github.com/facebook/react-native)
- [@nozbe/watermelondb](https://github.com/Nozbe/WatermelonDB)
- [react-native-nfc-manager](https://github.com/revtel/react-native-nfc-manager)

All the other dependecies used in this project can be found in this [confluene page][packages]


## Available on the Play store

<a href='https://play.google.com/store/apps/details?id=com.fairfood_collector'><img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png' height='80px'/></a>


### Preview

<img alt="This is an image" src="screenshot/login.jpg" width="150" />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

<img alt="This is an image" src="screenshot/farmers.jpg" width="150" /> 
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

<img alt="This is an image" src="screenshot/issue_card.jpg" width="150" />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

<img alt="This is an image" src="screenshot/transactions.jpg" width="150" />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<br>


## How to use app

If you want to know how harvest collector app works, you can follow the doc [here][how_it_works].


## About us

<img alt="This is an image" src="screenshot/fairfood_logo.png" width="150" />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<br><br>

[Fairfood][fairfood] accelerates the change towards a sustainable food system. We develop innovative solutions that enable businesses to improve their responsible business practices. Open and attainable solutions that are designed to democratise the world of food.


[documentation]: https://rightorigins.atlassian.net/l/cp/AUj5ae1t
[react_native_setup]: https://reactnative.dev/docs/environment-setup
[packages]: https://fairfood.atlassian.net/wiki/spaces/FA/pages/22675457/Collector+app+packages
[how_it_works]: https://fairfood.atlassian.net/wiki/spaces/THD/pages/24543453/Help+Centre
[fairfood]: https://fairfood.org/
