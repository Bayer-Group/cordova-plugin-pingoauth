
var exec = require('cordova/exec');
var prefs = window.AppSettings;
var $ = cordova.require('cordova-plugin-pingoauth.jQuery');

//Global variables for Oauth details
var TOKENNAME = "OAUTH_DETAILS";
var USERTOKENNAME = "USERDETAILS";


var Authentication = function () {
    this.AutoRefresh = true;
    this.timerFunction = null;
    this.OauthData = null;
    this.storedRefreshToken = true;
    this.UserDetails = null;
    this.isDefined = null;
    this.OfflineMode = null;
    this.ERROR_CODES = {
        INTERNAL_ERROR_ONLINE: 500,
        USER_NOT_FOUND_OFFLINE: 404,
        REFRESHTOKEN_NOT_FOUND: 401,
        USER_PASSWORD_OFFLINE_ISSUE: 403
    }

    if (prefs) {
        _that = this;
        prefs.get(function (value) {
            //Global profile Authentication event
            _that.OauthTestURL = value.oauthurl;
            _that.ClientID = value.client_id;
            _that.AppName = value.appname;
            _that.OfflineMode = value.offline_mode;
            _that.ProfileAPI = value.profileapi;
            _that.SecuredStorage = new cordova.plugins.SecureStorage(
                                   function () { console.log("Key chain initalized for" + _that.AppName); },
                                                 function (error) { console.log('Error ', error) },
                                                  _that.AppName, { native: false });

            //if offline mode for the app is enabled then refresh token when it is enabled
            if (_that.OfflineMode.toUpperCase() == "YES") {
                _that.SetOfflineMode()
            }

            //check the token and get it
            _that.CheckAndGettoken(
            function (UserData, tokenData) {
                _that.isDefined = true;
                document.addEventListener('deviceready', _that.RaiseInitializationReadyEvent(), false);
            }, function () {
                _that.isDefined = false;
                document.addEventListener('deviceready', _that.RaiseInitializationReadyEvent(), false);
            });

        },
                  function (error) { console.log("No user information present in the device") },
                  ["oauthurl", "client_id", "appname", "profileapi", "offline_mode"]
        );
    }
}

//In case the refreshing of token failed, raise this event
Authentication.prototype.RaiseRefreshFailedEvent = function (error) {
    var RefreshTokenFailedEvent = new CustomEvent('onRefreshTokenFailed', { detail: error });
    document.dispatchEvent(RefreshTokenFailedEvent);
}

//In refresh of token is successful, raise this event
Authentication.prototype.RaiseRefreshSuccessfulEvent = function (tokenData, UserData) {
    var RefreshTokenSuccessfulEvent = new CustomEvent('onRefreshTokenSuccessful', { detail: { OAUTH_DETAILS: tokenData, USERDETAILS: UserData } });
    document.dispatchEvent(RefreshTokenSuccessfulEvent);
}

//Raise this event on initialization
Authentication.prototype.RaiseInitializationReadyEvent = function () {
    var ProfileAuthenticationEvent = document.createEvent("Event");
    ProfileAuthenticationEvent.initEvent("onAuthenticationReady", true, true);
    document.dispatchEvent(ProfileAuthenticationEvent);
}

//Check the token on intialization , if refresh exists, get the token and the data
Authentication.prototype.CheckAndGettoken = function (successCallback, errorCallback) {
    if (this.SecuredStorage && this.AppName) {
        _that = this
        var win = function (tokenData) {
            _that.OauthData = tokenData;
            _that.setTimerToRefresh();
            localStorage.setItem(TOKENNAME, JSON.stringify(tokenData));
            _that.RetrieveUserDetails(function (data) {
                _that.UserDetails = data;
                localStorage.setItem(USERTOKENNAME, JSON.stringify(data));
                successCallback(tokenData, data);
            },
                                        function (error) {
                                            console.dir("An error has occured when retrieving the user token")
                                            errorCallback({ error_code: 500, error: error })
                                        });

            if (this.SecuredStorage)
                this.SecuredStorage.set(function (key) { console.log("key Stored" + key); },
                function (error) { console.log('Error ' + error); },
                 this.AppName + "REFRESHTOKEN",
                _that.OauthData.refresh_token);

        }

        var fail = function (error) {
            errorCallback({ error_code: _that.ERROR_CODES.INTERNAL_ERROR_ONLINE, error: error })
        }

        this.SecuredStorage.get(
            function (value) { _that.RefreshToken(win, fail, value) },
            function (error) { errorCallback({ error_code: _that.ERROR_CODES.REFRESHTOKEN_NOT_FOUND }); },
            this.AppName + "REFRESHTOKEN");


    }
}

//function to do the oauth call and login
Authentication.prototype.DoOauthCall = function (userName, passWord, success, error) {
    if (this.OauthTestURL && this.ClientID ) {
        _that = this;
        $.ajax({
            url: _that.OauthTestURL,
            type: "POST",
            dataType: "json",
            data: {
                client_id: _that.ClientID,
                grant_type: "password",
                username: userName,
                password: passWord
            },
            success: success,
            error: error,
            crossDomain: true,
            context: this,
            complete: function (jqXHR, textStatus) {
            }
        });
    }
}

//function to refresh the ping token
Authentication.prototype.RefreshToken = function (success, error, refresh_token) {
    if (this.OauthTestURL && this.ClientID ) {
        _that = this;
        $.ajax({
            url: _that.OauthTestURL,
            type: "POST",
            dataType: "json",
            data: {
                client_id: _that.ClientID,
                grant_type: "refresh_token",
                refresh_token: ((refresh_token) ? refresh_token : _that.OauthData.refresh_token)
            },
            success: success,
            error: error,
            crossDomain: true,
            context: this,
            complete: function (jqXHR, textStatus) {
            }
        });
    }
}

//function to set the refresh timer
Authentication.prototype.setTimerToRefresh = function () {
    if (this.AutoRefresh) {
        if (this.OauthData.access_token && this.OauthData.refresh_token && this.OauthData.expires_in) {
            _that = this
            var win = function (tokenData) {
                _that.OauthData = tokenData;
                _that.setTimerToRefresh();
                localStorage.setItem(TOKENNAME, JSON.stringify(tokenData));
                _that.RetrieveUserDetails(
                                          function (data) {
                                              _that.UserDetails = data;
                                              localStorage.setItem(USERTOKENNAME, JSON.stringify(data));
                                          },
                                          function (error) {
                                              _that.RaiseRefreshFailedEvent(error);
                                          })
                if (this.SecuredStorage) {
                    this.SecuredStorage.set(
                    function (key) { console.log('Key stored ' + key); },
                    function (error) { console.log('Error ' + error); },
                    this.AppName + "REFRESHTOKEN",
                    _that.OauthData.refresh_token);
                }
            }

            var fail = function (error) {
                _that.RaiseRefreshFailedEvent(error);
            }

            _that.timerFunction = window.setTimeout(
            function () { _that.RefreshToken(win, fail) },
            _that.OauthData.expires_in * 1000 - 600000
            )
        }
    }
}

//function to do the ouath login
Authentication.prototype.Login = function (userName, passWord, successCallback, errorCallback, refreshAutomatically) {
    this.AutoRefresh = (refreshAutomatically) ? refreshAutomatically : this.AutoRefresh;
    _that = this;
    var win = function (tokenData) {
        _that.OauthData = tokenData;
        _that.setTimerToRefresh();
        localStorage.setItem(TOKENNAME, JSON.stringify(tokenData));
        _that.RetrieveUserDetails(
                function (data) {
                    _that.UserDetails = data;
                    localStorage.setItem(USERTOKENNAME, JSON.stringify(data));
                    _that.isDefined = true;
                    //If the app has been enabled for offline mode, store the user name and password
                    if (_that.SecuredStorage && _that.OfflineMode.toUpperCase() == "YES") {
                        this.SecuredStorage.set(
                               function (key) { console.log('Offline mode authentication enabled for ' + key); },
                               function (error) { console.log('Error storing offline mode values' + error); },
                               userName.toUpperCase(),
                               passWord);
                    }

                    successCallback(data)
                },
                function (error) {
                    errorCallback({ error_code: ERROR_CODES.INTERNAL_ERROR_ONLINE, error: error })
                }
        )

        if (this.SecuredStorage) {
            this.SecuredStorage.set(
                                    function (key) { console.log('Key stored ' + key); },
                                    function (error) { console.log('Error ' + error); },
                                    this.AppName + "REFRESHTOKEN",
                                    _that.OauthData.refresh_token);
        }
        //successCallback(tokenData);
    }

    var fail = function (error) {
        errorCallback({ error_code: 500, error: error })
    }

    //IF offline
    if (_that.OfflineMode.toUpperCase() == "YES" && navigator.connection.type == Connection.NONE) {
        this.SecuredStorage.get(
        function (_passWord) {
            if (_passWord == passWord) {
                _that.UserDetails = JSON.parse(localStorage.getItem(USERTOKENNAME));
                successCallback(_that.UserDetails);
            }
            else
                errorCallback({ error_code: _that.ERROR_CODES.USER_PASSWORD_OFFLINE_ISSUE });
        },
        function (error) {
            console.log('Error storing offline mode values' + error);
            errorCallback({ error_code: _that.ERROR_CODES.USER_NOT_FOUND_OFFLINE });
        },
        userName.toUpperCase())
    }
        //Else go the usual route
    else
        this.DoOauthCall(userName, passWord, win, fail)
}

//function to retrieve the profile information
Authentication.prototype.RetrieveUserDetails = function (success, error, access_token) {
    if (this.ProfileAPI && this.ClientID) {
        _that = this;
        $.ajax({
            url: _that.ProfileAPI,
            headers: {
                "Authorization": "Bearer " + ((access_token) ? access_token : _that.OauthData.access_token)
            },
            type: "POST",
            dataType: "json",
            data: JSON.stringify({
                "query" : "{ getCurrentUser { id preferredName{ full first last middle } organization{ id name } brand businessArea photo officePhone officeLocation company{ code } site { id name lat long timezone country{ id name code2 code3 region{ id name }}} email employeeId employeeType applications{ id name entitlements{ id name code}} mailStop manager{ id preferredName{ full }}} }"
            }),
            success: success,
            error: error,
            crossDomain: true,
            context: this,
            complete: function (jqXHR, textStatus) {
            }
        });
    }
}

//function to set the offline mode
Authentication.prototype.SetOfflineMode = function () {

    _that = this;

    //This is a function to keep checking for refresh tokens,till it gets a connectivity
    //This check is to make sure a refresh token is obtained , even there is a difference in time between the establishing of the network and actual connectivity to the internet
    var KeepCheckingForRefreshToken = function () {
        if (_that.isDefined) {
            _that.CheckAndGettoken(
                     function (tokenData, UserData) {
                         _that.isDefined = true;
                         console.dir("The device cameback online");
                         _that.RaiseRefreshSuccessfulEvent(tokenData, UserData);
                     }, function (error) {
                         if (error.error && error.error.status == 0)
                             KeepCheckingForRefreshToken();
                         else {
                             _that.isDefined = false;
                             _that.RaiseRefreshFailedEvent(error);
                         }
                     });
        }
    }


    //Where it comes online, refresh the oauth token and raise event
    document.addEventListener("online", KeepCheckingForRefreshToken, false);

    //When it goes offline, clear the time out
    document.addEventListener("offline",
                               function () {
                                   console.dir("The device went offline");
                                   if (_that.timerFunction) {
                                       window.clearTimeout(_that.timerFunction);
                                       _that.timerFunction = null;
                                   }
                               }
                               , false);

}

//function to log out the app
Authentication.prototype.LogOut = function () {
    _that = this;
    if (this.SecuredStorage) {
        this.SecuredStorage.remove(
        function (key) {
            console.log('Removed ' + key);
        },
        function (error) { console.log('Error ' + error); },
         this.AppName + "REFRESHTOKEN");
    }
    localStorage.removeItem(TOKENNAME);
    localStorage.removeItem(USERTOKENNAME);
    _that.OauthData = null;
    if (_that.timerFunction)
        window.clearTimeout(_that.timerFunction);
    _that.timerFunction = null;
    _that.isDefined = false;
}

if (!cordova.plugins.Authentication) {
    cordova.plugins.Authentication = new Authentication();
}

if (typeof module != 'undefined' && module.exports) {
    module.exports = SecureStorage;
}
