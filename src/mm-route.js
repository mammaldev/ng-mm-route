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
  this.parseUrls = function parse( urlObj) {
    var objectKeys = Object.keys(urlObj);
    if ( objectKeys.length > 0 ) {
      if ( urlObj.hasOwnProperty('url') ) {
        var configObj = {
          url: urlObj.url,
        };
        if ( urlObj.access.length > 1 || urlObj.access[ 0 ].roles[ 0 ] !== 'ALL') {
          configObj.routeConf = {
            template: '<mm-role-resolver route=\'' + JSON.stringify(urlObj) + '\'></mm-role-resolver>',
          };
        } else {
          configObj.routeConf = urlObj.access[ 0 ].page;
        }
        return [ configObj ];
      } else {
        var objectKey = objectKeys[ 0 ];
        var objAfterKey = urlObj[ objectKey ];
        delete urlObj[ objectKey ];
        return parse(objAfterKey).concat(parse(urlObj));
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

    return {
      get: get,
      goTo: goTo,
      getRoute: getRoute,
      roleGetter: this.roleGetter,
      _parseUrls: this.parseUrls
    };

  } ];

} ]);
