angular.module('mmRoute', [
  'ngRoute'
])
.provider('mmRoute', [ '$routeProvider', function ($routeProvider) {

  var interpolation = /(:[\w*]+)(\?(?=\/|$))?/g;
  var interpolationMarkers = /[:*?]/g;
  var interpolationOptional = /:[^\/]+\?/g;


  //
  // Set a URL to redirect to when no other route matches the current URL
  //
  // Arguments:
  //   url    {String}    The URL to redirect to
  //
  this.setDefaultRoute = function setDefaultRoute(url) {
    $routeProvider.otherwise({
      redirectTo: url
    });
    this.defaultUrl = url;
  };

  //
  // Set a URL to redirect to when the base route is requested
  //
  // Arguments:
  //   url    {String}    The URL to redirect to
  //
  this.setBaseRoute = function setBaseRedirect(url) {
    $routeProvider.when('/', {
      redirectTo: url
    });
  };

  //
  // Sets a function to retrieve roles  available to the active user
  //
  // Arguments:
  //   roleGetter    {function()}    List of roles available to the active user
  //
  this.setRoleGetter = function setRoleGetter( roleGetter ) {
    this.roleGetter = roleGetter;
  };

  //
  // Parses urls so that routes can be applied
  //
  // Arguments:
  //   routes    {Object}    Urls with matching access objects
  //
  this.parseUrls = function parseUrls( urlObj, path ) {
    path = path || [];
    var objectKeys = Object.keys(urlObj);
    if ( objectKeys.length > 0 ) {
      if ( urlObj.hasOwnProperty('url') ) {
        var configObj = {
          url: urlObj.url
        };
        if ( urlObj.access.length > 1 || urlObj.access[ 0 ].roles[ 0 ] !== 'ALL' ) {
          configObj.routeConf = {
            template: '<mm-role-resolver route-path="' + path.join('.') + '"></mm-role-resolver>'
          };
        } else {
          configObj.routeConf = urlObj.access[ 0 ].view;
        }
        return [ configObj ];
      } else {
        var objectKey = objectKeys[ 0 ];
        var objAfterKey = urlObj[ objectKey ];
        delete urlObj[ objectKey ];
        return parseUrls(objAfterKey, path.concat([ objectKey ])).concat(parseUrls(urlObj, path));
      }
    } else {
      return [];
    }
  };

  this.setRoutes = function setRoutes( routes ) {

    // mmRoute provides role-based routing. There's no point using it if you
    // haven't set up the roles first
    if ( !this.roleGetter ) {
      throw new Error(
        'Role getter has not yet been configured. Call setRoles before setRoutes'
      );
    }

    this.routes = routes;
    var urlObjects = this.parseUrls(angular.copy(routes));

    // Set up a route via $routeProvider for each route

    urlObjects.forEach(function ( urlObject ) {
      $routeProvider.when(urlObject.url.split('?')[ 0 ], urlObject.routeConf);
    });

  };

  // Set up the mmRoute factory
  this.$get = [ '$location', function mmRouteFactory($location) {

    var routes = this.routes;

    //
    // Get a URL by route name and role. Route paramater data will be
    // interpolated into the returned URL.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //   [data]    {Object}    A map of route paramater names to data

    function get( name, data ) {

      // Get the matching route definition
      var route = getRoute(name);

      // If we haven't found a matching route by now then either it doesn't
      // exist or the user does not have a role that is able to access it. In
      // either case we cannot proceed
      if ( !route ) {
        return;
      }

      // Copy the URL string so we don't affect the actual route definition
      var url = route.url;

      // Get any interpolation strings from the URL definition
      var parts = url.match(interpolation);

      // If there is data to interpolate into the URL we interpolate it now and
      // return the finished URL string
      if (parts && data) {

        Object.keys(data).forEach(function (key) {

          parts.forEach(function (part) {

            var matcher = part.replace(interpolationMarkers, '');
            var greedy = part.indexOf('*') === part.length - 1;

            // If the interpolation string ends with * we greedily match it
            if (greedy && key.slice(0, matcher.length) === matcher) {

              url = url.replace(part, data[key]);

            // Otherwise we need an exact match
            } else if (!greedy && key === matcher) {

              url = url.replace(part, data[key]);
            }
          });
        });
      }

      // If there are any optional interpolation parts left in the URL at this
      // point then data wasn't provided for them and they can be removed
      url = url.replace(interpolationOptional, '');

      return url;
    }

    //
    // Get a route definition by name.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //

    function getRoute( name ) {
      var keys = name.split('.');

      var urlObject = routes;
      for ( var i = 0; i < keys.length; i++ ) {
        var key = keys[ i ];
        if ( urlObject.hasOwnProperty(key) ) {
          urlObject = urlObject[ key ];
        } else {
          return null;
        }
      }

      return urlObject;
    }

    //
    // Redirect the browser to the URL associated with a route.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //   [data]    {Object}    A map of route paramater names to data
    //

    function goTo( name, data ) {
      $location.url(get(name, data));
    }

    function getRoutes() {
      return routes;
    }

    return {
      get: get,
      goTo: goTo,
      getRoute: getRoute,
      getRoutes: getRoutes,
      roleGetter: this.roleGetter,
      defaultUrl: this.defaultUrl,
      _parseUrls: this.parseUrls
    };

  } ];

} ]);

angular.module('mmRoute')
.factory('mmRoleResolver', function ( $window, $injector, $route, mmRoute ) {

  function checkViewPermission( accessRole ) {
    var roles = $injector.invoke(mmRoute.roleGetter, $window);

    if ( !Array.isArray(accessRole) ) {
      return roles.indexOf(accessRole) !== -1;
    } else {
      return accessRole.every(function ( singleRole ) {
        return roles.indexOf(singleRole) !== -1;
      });
    }
  }

  function chooseView( accessObjects ) {
    var chosenView = null;

    for ( var i = 0; i < accessObjects.length; i++ ) {
      var accessObject = accessObjects[ i ];
      if ( accessObject.roles.some(checkViewPermission) ) {
        chosenView = accessObject.view;
        break;
      }
    }

    return chosenView;

  }

  function updateCurrentRoute ( chosenView ) {
    var allowedKeys = [
      'caseInsensitiveMatch',
      'reloadOnSearch',
    ];

    if ( $route.current && chosenView ) {
      Object.keys(chosenView).forEach(function ( key ) {
        if ( !$route.current.$$route[ key ] || allowedKeys.indexOf(key) > -1 ) {
          $route.current.$$route[ key ] = chosenView[ key ];
        }
      });
    }
  }

  return {
    chooseView: chooseView,
    updateCurrentRoute: updateCurrentRoute,
    _checkViewPermission: checkViewPermission,
  };

})
.directive('mmRoleResolver', function ( $http, $compile, $templateCache, $controller, $location, $q, mmRoute, mmRoleResolver  ) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      routePath: '@',
    },
    link: function ( scope, element ) {
      scope.route = mmRoute.getRoute(scope.routePath);
      var chosenView = mmRoleResolver.chooseView(scope.route.access);
      if ( !chosenView ) {
        $location.path(mmRoute.defaultUrl);
      } else {

        mmRoleResolver.updateCurrentRoute(chosenView);

        var controllerName = chosenView.controller;

        var deferred = $q.defer();
        if ( chosenView.templateUrl ) {
          $http.get(chosenView.templateUrl, { cache: $templateCache })
          .success(deferred.resolve.bind(deferred))
          .error(deferred.reject.bind(deferred));
        } else {
          deferred.resolve(chosenView.template || '');
        }

        deferred.promise
        .then(function ( template ) {
          var templateScope = scope.$new();
          element.html(template);
          if ( controllerName ) {
            var templateCtrl = $controller(controllerName, { $scope: templateScope });
            element.children().data('$ngControllerController', templateCtrl);
          }
          $compile(element.contents())(templateScope);
        })
        .catch(function ( err ) {
          throw err;
        });
      }
    }
  };
});
