(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$state', 'angularAuth0', '$timeout'];

  function authService($state, angularAuth0, $timeout) {

    var idToken;
    var accessToken;
    var expiresAt;
    var scopes;
    var userProfile;

    function getIdToken() {
      return idToken;
    }

    function getAccessToken() {
      return accessToken;
    }

    function login() {
      angularAuth0.authorize();
    }

    function handleAuthentication() {
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.idToken) {
          localLogin(authResult);
          $state.go('home');
        } else if (err) {
          $timeout(function() {
            $state.go('home');
          });
          console.log(err);
          alert('Error: ' + err.error + '. Check the console for further details.');
        }
      });
    }

    function getProfile(cb) {
      if (!accessToken) {
        throw new Error('Access token must exist to fetch profile');
      }
      angularAuth0.client.userInfo(accessToken, function(err, profile) {
        if (profile) {
          setUserProfile(profile);
        }
        cb(err, profile);
      });
    }

    function setUserProfile(profile) {
      userProfile = profile;
    }

    function getCachedProfile() {
      return userProfile;
    }

    function localLogin(authResult) {
      // Set isLoggedIn flag in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      // Set the time that the access token will expire at
      expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();

      // If there is a value on the `scope` param from the authResult,
      // use it to set scopes in the session for the user. Otherwise
      // use the scopes as requested. If no scopes were requested,
      // set it to nothing
      scopes = authResult.scope || REQUESTED_SCOPES || '';

      accessToken = authResult.accessToken;
      idToken = authResult.idToken;
    }

    function renewTokens() {
      angularAuth0.checkSession({},
          function(err, result) {
            if (err) {
              console.log(err);
            } else {
              localLogin(result);
            }
          }
      );
    }

    function logout() {
      // Remove isLoggedIn flag from localStorage
      localStorage.removeItem('isLoggedIn');
      // Remove tokens and expiry time from localStorage
      accessToken = '';
      idToken = '';
      expiresAt = 0;
      scopes = '';

      angularAuth0.logout({
        returnTo: window.location.origin
      });

      $state.go('home');
    }

    function isAuthenticated() {
      // Check whether the current time is past the
      // access token's expiry time
      return localStorage.getItem('isLoggedIn') === 'true' && new Date().getTime() < expiresAt;
    }

    function userHasScopes(requestedScopes) {
      var grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
      for (var i = 0; i < requestedScopes.length; i++) {
        if (grantedScopes.indexOf(requestedScopes[i]) < 0) {
          return false;
        }
      }
      return true;
    }

    return {
      login: login,
      getIdToken: getIdToken,
      getAccessToken: getAccessToken,
      getProfile: getProfile,
      getCachedProfile: getCachedProfile,
      handleAuthentication: handleAuthentication,
      logout: logout,
      isAuthenticated: isAuthenticated,
      renewTokens: renewTokens,
      userHasScopes: userHasScopes
    }
  }
})();
