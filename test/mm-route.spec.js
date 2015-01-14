describe('mm.route module', function () {

  var provider;

  beforeEach(angular.mock.module('mmRoute'));
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
      'setRoleGetter',
      'setRoutes'
    ];

    it('should provide an mmRoute service', function () {
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute).toBeDefined();
      });
    });

    it('should throw when configuring routes before roles', function () {
      function test() {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoutes({
            ADMIN: {
              settings: {
                url: '/settings'
              }
            }
          });
        });
        angular.mock.inject(function (mmRoute) {
          return mmRoute;
        });
      }
      expect(test).toThrow();
    });

    methods.forEach(function (method) {
      it('should have a ' + method + ' method', function () {
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
        mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings')).toEqual('/settings');
      });
    });

    it('should return undefined for undefined routes', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('profile')).toEqual(undefined);
      });
    });


    // Nested routes are accessed by concatenating the names with '.', as if
    // you were accessing the property in code directly
    it('should allow the retrieval of a URL from a nested route', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          profile: {
            settings: {
              url: '/settings',
              access: [ { page: {} } ]
            }
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('profile.settings')).toEqual('/settings');
      });
    });

    it('should allow for a retrieval of URL with multiple roles', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
              page: {},
              roles: ['ADMIN']
            },
            {
              page: {},
              roles: ['TEACHER']
            }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings')).toEqual('/settings');
      });
    });

    // Interpolation is based on a simple match of ':' concatenated with the
    // provided key. It's case-sensitive and only the first match will be
    // replaced
    it('should allow interpolation of data within URLs', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:userId',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user', {
          userId: '12345',
          other: '6789'
        })).toEqual('/users/12345');
      });
    });
    
    it('should greedily match interpolated parts marked with *', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:user*',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user', {
          userId: '12345'
        })).toEqual('/users/12345');
      });
    });

    it('should allow optional interpolation parts marked with ?', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:userId?',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user')).toEqual('/users/');
        expect(mmRoute.get('user', {
          userId: '12345'
        })).toEqual('/users/12345');
      });
    });

    // The goTo method uses the built-in Angular $location service to change
    // the URL in the browser
    it('should allow redirection of browser via a goTo method', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [ { page: {} } ]
          }
        });
      });
      angular.mock.inject(function ($location, mmRoute) {
        spyOn($location, 'url');
        mmRoute.goTo('settings');
        expect($location.url).toHaveBeenCalledWith('/settings');
      });
    });
  });
});
