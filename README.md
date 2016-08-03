# cordova-plugin-pingoauth
This is a plugin for doing ping/oauth2 authenticaton for cordova based applications

#Introduction
This is plugin is for use with Apache Cordova and implements Oauth/Ping authentication and refresh of oauth tokens in cordova based applications. This plugin supports both offline and online modes of authentication.

#Supported platforms
- Android
- iOS

#Features
1. Stay signed in capability after initial login for apps
2. Automatic refresh of oauth tokens every 2 hours
3. Support for both Offline and online modes
4. Automatic retrieval and caching of user information based on the Bearer token
5. Secure caching of oauth access tokens for use in apps

#Dependencies 
The following plugins are pulled automatically when this plugin is installed. No seperate installation is needed.
- cordova-plugin-secure-storage
- cordova-plugin-appsettings
- cordova-plugin-secure-storage

#Installation
This plugin can be installed through the cordova command line interface

cordova plugin add https://github.com/MonsantoCo/cordova-plugin-pingoauth.git --variable APPNAME="{APPNAME}" --
variable OAUTHURL="https://test.amp.monsanto.com/as/token.oauth2" --variable CLIENT_ID="XXXXXX" --variable 
CLIENT_SECRET="XXXXXX" --variable OFFLINE_MODE="Yes" --variable PROFILEAPI="{API for getting the user profile information}"

#Plugin API

#### Bootstrap your jQuery or Angular application on the following event

var onAuthenticationReady = function () {
        receivedEvent('deviceready');
    }

    var onDeviceReady = function () {
        document.addEventListener('onAuthenticationReady', onAuthenticationReady, false);
    };

    var receivedEvent = function (event) {
        console.log('Start event received, bootstrapping application setup.');
        angular.bootstrap($('html'), ['DGApp']);
    };
    
This is called after deviceready event passed by cordova . So you can straight away bootstrap on the receipt of this event

#### Check if the user is already authenticated
Window.cordova.plugins.Authentication.isDefined 

if this is true, the user has already logged in atleast once and it automatically retrieves the access token and allows you into the app

if this is false, the user is logging in for the first time or has reset all his token data , forcing him to relogin again.

#### Login and retrieve the user profile information

Window.cordova.plugins.Authentication.Login(username, password, successcallback, errorcallback,refreshautomatically)

If you dont want the current session to refresh automatically in the background, pass false for the last argument. But I would strongly advise against doing this.

#### Access the access token and the user profile information

If the login/refresh is successful, the plugin puts two objects in the localstorage

You can access the oauth access and refresh token from this object

    var OauthDetails = localStorage.getItem("OAUTH_DETAILS") (You might need to parse it to Json)
 
Alternatively you can access the access and refresh token from the Authentication object

  var OauthDetails =  window.cordova.plugins.Authentication.OAuthData
   
Similarly you can access the user information from the local storage

   var UserDetails = localStorage.getItem("USERDETAILS") (you might need to parse it to json)

Alternatively you can access the user details from Authentication object

 var _userObject = window.cordova.plugins.Authentication.UserDetails;

When the back ground refresh happens, all these objects are automatically refreshed.

#### Refresh the ping access token

Window.cordova.plugins.Authentication.Refresh(successcallback, errorcallback, refresh_token(optional))

The last argument is optional. If it is not passed, it will take the last retrieved refresh token. Use this function to trigger a refresh in case you ever need to refresh manually. Typically the refresh automatically happens in the background and usage of this function is limited

#### Event handlers incase of refresh failure
Refresh of ping tokens happens automatically in the background. If for some reason the refresh ever fails, it raises an event

document.addEventListener('onRefreshTokenFailed', function (e) { console.dir(e.detail); }, false);

What you do on the fail is upto your own discretion. Ideally we would recommend logging out or keep trying using the refresh API

In case of the App being configured to support offline, the automatic refresh would turn off if the application ever goes offline. It would configure itself back if the application comes online

#### Event handlers incase of refresh success 
This happens only if offline mode is activated. If offline mode is not activated , no event is raised for refresh success

document.addEventListener('onRefreshTokenSuccessful', function (e) {},false);

#### Logout and Reset all user data
window.cordova.plugins.Authentication.LogOut();

This logsout the user and deletes all his login data from his phone, thus enforcing re-login. Please use this with caution

#Conclusion
This has been written to eliminate adding a lot of redundant code in cordova based applications. If you come across any issues using this or have any good ideas, Please feel free to add it as an issue.






