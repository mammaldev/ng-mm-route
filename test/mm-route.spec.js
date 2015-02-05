
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
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('settings')).toEqual('/settings');
      });
    });

    it('should return undefined for undefined routes', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
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
              access: [
                {
                  page: {},
                  roles: ['ALL']
                }
              ]
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
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('settings')).toEqual('/settings');
      });
    });

    // Interpolation is based on a simple match of ':' concatenated with the
    // provided key. It's case-sensitive and only the first match will be
    // replaced
    it('should allow interpolation of data within URLs', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:userId',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('user', {
          userId: '12345',
          other: '6789'
        })).toEqual('/users/12345');
      });
    });

    it('should greedily match interpolated parts marked with *', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:user*',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('user', {
          userId: '12345'
        })).toEqual('/users/12345');
      });
    });

    it('should allow optional interpolation parts marked with ?', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:userId?',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute.get('user')).toEqual('/users/');
        expect(mmRoute.get('user', {
          userId: '12345'
        })).toEqual('/users/12345');
      });
    });

    // The goTo method uses the built-in Angular $location service to change
    // the URL in the browser
    it('should allow redirection of browser via a goTo method', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ( $location, mmRoute ) {
        spyOn($location, 'url');
        mmRoute.goTo('settings');
        expect($location.url).toHaveBeenCalledWith('/settings');
      });
    });

    //If the route that the user wants to access is not accessible to all, the user is directed to a
    //template containing the role-resolver directive
    it('should redirect to role-resolver directive if page is not accessible to all ', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute._parseUrls({
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: [ 'ADMIN' ]
              }
            ]
          }
        })).toEqual(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"page":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
              }
            }
          ]
        );
      });
    });

    it('should redirect nested routes to role-resolver directive if page is not accessible to all ', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute._parseUrls({
          home: {
            settings: {
              url: '/settings',
              access: [
                {
                  page: {},
                  roles: [ 'ADMIN' ]
                }
              ]
            }
          }
        })).toEqual(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"page":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
              }
            }
          ]
        );
      });
    });

    //If the route is accessible to all, the template associated with that route should be rendered
    it('should not redirect to role-resolver directive if page is accessible to all ', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute._parseUrls({
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        })).toEqual(
          [
            {
              url: '/settings',
              routeConf: {}
            }
          ]
        );
      });
    });

    it('should return an array of all provided url objects', function () {
      angular.mock.module(function ( mmRouteProvider ) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function ( mmRoute ) {
        expect(mmRoute._parseUrls({
          home: {
            settings: {
              url: '/settings',
              access: [
                {
                  page: {},
                  roles: [ 'ADMIN' ]
                }
              ]
            }
          },
          settings: {
            url: '/settings',
            access: [
              {
                page: {},
                roles: ['ALL']
              }
            ]
          }
        })).toEqual(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"page":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
              }
            },
            {
              url: '/settings',
              routeConf: {}
            }
          ]
        );
      });
    });
  });

  describe('roleResolver', function() {

    it('should provide an mmRoleResolver service', function () {
      angular.mock.inject(function ( mmRoleResolver ) {
        expect(mmRoleResolver).toBeDefined();
      });
    });

    describe('#_checkTemplatePermission', function () {

      //The role-resolver is able to determine whether a template can be accessed by a user
      //with a particular role
      it('should return true for a role that exists', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver._checkTemplatePermission('ADMIN')).toEqual(true);
        });
      });

      it('should return false for a role that does not exist', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver._checkTemplatePermission('PUPIL')).toEqual(false);
        });
      });

      it('should return true for a valid array of roles', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver._checkTemplatePermission(['ADMIN', 'TEACHER'])).toEqual(true);
        });
      });

      it('should return false for an invalid array of roles', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'PUPIL', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver._checkTemplatePermission(['ADMIN', 'TEACHER'])).toEqual(false);
        });
      });

    });

    describe('#chooseTemplate', function () {
      //Role-resolver finds the first template that matches one of the roles of the user
      it('should return the template that matches a role', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'PUPIL', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver.chooseTemplate(
            [
              {
                roles: ['ADMIN'],
                page: 'admin'
              },
              {
                roles: ['TEACHER'],
                page: 'teacher'}
             ]
          )).toEqual('teacher');
        });
      });

      it('should return the first valid match', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver.chooseTemplate(
            [
              {
                roles: ['ADMIN'],
                page: 'admin'
              },
              {
                roles: ['TEACHER'],
                page: 'teacher'
              }
            ]
          )).toEqual('admin');
        });
      });

      it('should throw an error if no match is found', function () {
        angular.mock.module(function ( mmRouteProvider ) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ROGUE' ]; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(function () {
            mmRoleResolver.chooseTemplate(
              [
                {
                  roles: ['ADMIN'],
                  page: 'admin'
                },
                {
                  roles: ['TEACHER'],
                  page: 'teacher'
                }
              ]
            );
          }).toThrow();
        });
      });

      //Role-resolver is able to call roleGetter that makes use of the $window service
      it('should be able to invoke $window when calling getRoles', function () {

        var windowMock = {
          currentUser: {
            roles: ['ADMIN']
          }
        };
        angular.mock.module(function ( mmRouteProvider, $provide ) {
          $provide.value('$window', windowMock);
          mmRouteProvider.setRoleGetter(function ( $window ) { return $window.currentUser.roles; });
        });
        angular.mock.inject(function ( mmRoleResolver ) {
          expect(mmRoleResolver.chooseTemplate(
            [
              {
                roles: ['ADMIN'],
                page: 'admin'
              }
            ])).toEqual('admin');
        });
      });
    });

    describe('#updateCurrentRoute', function () {

      var routeMock;

      beforeEach(function () {
        routeMock = {
          current: {
            $$route: {}
          }
        };
      });

      it('should copy properties across', function () {

        angular.mock.module(function ( $provide ) {
          $provide.value('$route', routeMock);
        });

        angular.mock.inject(function ( mmRoleResolver, $route ) {
          mmRoleResolver.updateCurrentRoute({
            abc: 123,
          });
          expect($route.current.$$route.abc).toEqual(123);
        });
      });

      it('should not override properties already set', function () {
        routeMock.current.$$route.abc = 'abc';

        angular.mock.module(function ( $provide ) {
          $provide.value('$route', routeMock);
        });

        angular.mock.inject(function ( mmRoleResolver, $route ) {
          mmRoleResolver.updateCurrentRoute({
            abc: 123,
          });
          expect($route.current.$$route.abc).toEqual('abc');
        });
      });

    });

    //Role-resolver is able to compile the template that correpond to the roles of the current user
    describe('compiling the template', function () {

      it('should compile without errors ', function () {

        var httpMock = {
          get: function () {
            return {
              then: function ( fun ) {
                return fun({ data: "data" });
              }
            };
          }
        };

        var controllerMock = angular.noop;

        angular.mock.module(function ( mmRouteProvider, $provide ) {
          $provide.value('$http', httpMock);
          $provide.value('$controller', controllerMock);
          mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; });
        });

        angular.mock.inject(function ( mmRoleResolver, $compile, $rootScope ) {
          var element = angular.element('<mm-role-resolver route=\'{"url":"/settings","access":[{"page":{"controller":"controller"},"roles":["ADMIN"]}]}\'></mm-role-resolver>');
          var compiled = $compile(element)($rootScope);
          expect(compiled.children().html()).toEqual('data');
        });
      });

      it('should compile without errors without a controller', function () {

        var httpMock = {
          get: function () {
            return {
              then: function ( fun ) {
                return fun({ data: "data" });
              }
            };
          }
        };

        angular.mock.module(function ( mmRouteProvider, $provide ) {
          $provide.value('$http', httpMock);
          mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; });
        });

        angular.mock.inject(function ( mmRoleResolver, $compile, $rootScope ) {
          var element = angular.element('<mm-role-resolver route=\'{"url":"/settings","access":[{"page":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>');
          var compiled = $compile(element)($rootScope);
          expect(compiled.children().html()).toEqual('data');
        });
      });
    });
  });
});
