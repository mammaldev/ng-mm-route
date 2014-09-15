describe('mm.route module', function () {

  var provider;

  beforeEach(angular.mock.module('mm.route'));
  beforeEach(angular.mock.module(function (mmRouteProvider) {
    provider = mmRouteProvider;
  }));

  // Test that the methods we expect to be available on the provider are indeed
  // available. This helps to ensure backwards compatability isn't broken when
  // changing the provider itself (rather than the service)
  describe('mmRouteProvider', function () {

    var methods = [
      'setDefaultRoute',
      'setBaseRoute',
      'setRoles',
      'setRoutes'
    ];

    it('should provide an mmRoute service', function () {
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute).toBeDefined();
      });
    });

    methods.forEach(function (method) {
      it('should have a setRoles method', function () {
        expect(provider[method]).toEqual(jasmine.any(Function));
      });
    });
  });

  describe('mmRoute service', function () {

    // By setting a default route any request to a URL not otherwise matched to
    // a route should be redirected to the default
    it('should allow a default route to be defined', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setDefaultRoute('/404');
      });
      angular.mock.inject(function ($route) {
        expect($route.routes[null].redirectTo).toEqual('/404');
      });
    });

    // By setting a base route any request to the root should be redirected to
    // the specified base route URL
    it('should allow a base route to be defined', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setBaseRoute('/home');
      });
      angular.mock.inject(function ($route) {
        expect($route.routes['/'].redirectTo).toEqual('/home');
      });
    });

    // Simple (non-nested) routes can be accessed by simply providing the name
    it('should allow the retrieval of URLs', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoles([ 'ADMIN' ]);
        mmRouteProvider.setRoutes({
          ADMIN: {
            settings: {
              url: '/settings'
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings')).toEqual('/settings');
      });
    });

    // Nested routes are accessed by concatenating the names with '.', as if
    // you were accessing the property in code directly
    it('should allow the retrieval of a URL from a nested route', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoles([ 'ADMIN' ]);
        mmRouteProvider.setRoutes({
          ADMIN: {
            profile: {
              settings: {
                url: '/settings'
              }
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('profile.settings')).toEqual('/settings');
      });
    });

    // If more than one role is specified and there is a matching route defined
    // for more than one of those roles you should be able to specify which
    // role to use
    it('should allow the retrieval of a URL by role', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoles([ 'ADMIN', 'USER' ]);
        mmRouteProvider.setRoutes({
          ADMIN: {
            settings: {
              url: '/settings'
            }
          },
          USER: {
            settings: {
              url: '/profile'
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings', 'USER')).toEqual('/profile');
      });
    });

    // Interpolation is based on a simple match of ':' concatenated with the
    // provided key. It's case-sensitive and only the first match will be
    // replaced
    it('should allow interpolation of data within URLs', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoles([ 'ADMIN' ]);
        mmRouteProvider.setRoutes({
          ADMIN: {
            user: {
              url: '/users/:userId'
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user', {
          userId: '12345'
        })).toEqual('/users/12345');
      });
    });

    it('should allow retrieval of a route definition by role', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoles([ 'ADMIN' ]);
        mmRouteProvider.setRoutes({
          ADMIN: {
            settings: {
              url: '/settings',
              arbitraryData: 42
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        var route = mmRoute.getRoute('settings');
        expect(route.arbitraryData).toEqual(42);
      });
    });
  });
});
