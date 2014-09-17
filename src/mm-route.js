angular.module('mm.route', [
  'ngRoute'
])
.provider('mmRoute', function ($routeProvider) {

  // Utility function to add route definitions to the $routeProvider from the
  // ngRoute module
  function applyRoutes(routes) {
    Object.keys(routes).forEach(function (base) {

      var baseRoute = routes[base];

      if (baseRoute.hasOwnProperty('url')) {

        // If this is an actual route definition then add it to the
        // $routeProvider
        $routeProvider.when(baseRoute.url, baseRoute);
      } else {

        // Otherwise it's a nested definition and we need to recurse into it
        applyRoutes(baseRoute);
      }
    });
  }

  // Utility function to return the value of a nested object key when given a
  // string such as 'key.nested.deeply'
  function mapKeys(keys, obj) {
    if (!keys.length) {
      return obj;
    }

    var key = keys[0];

    if (!obj.hasOwnProperty(key)) {
      return;
    }

    return mapKeys(keys.slice(1, keys.length), obj[key]);
  }

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
  // Set the roles available to the active user
  //
  // Arguments:
  //   roles    {String[]}    List of roles available to the active user
  //
  this.setRoles = function setRoles(roles) {
    this.roles = roles;
  };

  //
  // Set the routes available throughout the app
  //
  // Arguments:
  //   routes    {Object}    Map of roles to route definitions
  //
  this.setRoutes = function setRoutes(routes) {

    // mmRoute provides role-based routing. There's no point using it if you
    // haven't set up the roles first
    if (!this.roles) {
      throw new Error(
        'No roles have been configured. Call setRoles before setRoutes'
      );
    }

    this.routes = routes;

    // Set up a route via $routeProvider for each route available to the given
    // role
    this.roles.forEach(function (role) {

      var roleRoutes = routes[role];

      if (roleRoutes) {
        applyRoutes(roleRoutes);
      }
    });
  };

  // Set up the mmRoute factory
  this.$get = function mmRouteFactory($location) {

    var routes = this.routes;
    var roles = this.roles;

    //
    // Get a URL by route name and role. Route paramater data will be
    // interpolated into the returned URL.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //   [data]    {Object}    A map of route paramater names to data
    //   [role]    {String}    The role to use in the case of multiple routes
    //
    function get(name, data, role) {

      // The `data` and `role` arguments are both optional. This handles the
      // case where `data` is undefined but `role` is not
      if (arguments.length === 2 && typeof data === 'string') {
        role = data;
        data = undefined;
      }

      // Get the matching route definition
      var route = getRoute(name, role);

      // If we haven't found a matching route by now then either it doesn't
      // exist or the user does not have a role that is able to access it. In
      // either case we cannot proceed
      if (!route) {
        return;
      }

      // Copy the URL string so we don't affect the actual route definition
      var url = route.url;

      // If there's no data to interpolate into the URL then we're done
      if (data === undefined) {
        return url;
      }

      // If there is data to interpolate into the URL we interpolate it now and
      // return the finished URL string
      Object.keys(data).forEach(function (key) {
        url = url.replace(':' + key, data[key]);
      });

      return url;
    }

    //
    // Get a route definition by name and role.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //   [role]    {String}    The role to use in the case of multiple routes
    //
    function getRoute(name, role) {

      var keys = name.split('.');
      var route;

      if (role) {

        // If a role is specified we want to return the route corresponding to
        // that role (if it exists)
        return mapKeys(keys, routes[role]);

      } else {

        // If a role was not specified we return the first matching route for
        // the roles available to the active user
        for (var i = 0; i < roles.length; i++) {
          route = mapKeys(keys, routes[roles[i]]);
          if (route) {
            return route;
          }
        }
      }

      return route;
    }

    //
    // Redirect the browser to the URL associated with a route.
    //
    // Arguments:
    //   name      {String}    Name of the route; nested names separated by .
    //   [role]    {String}    The role to use in the case of multiple routes
    //
    function goTo(name, role) {
      $location.url(get(name, role));
    }

    return {
      get: get,
      goTo: goTo,
      getRoute: getRoute
    };
  };
});
