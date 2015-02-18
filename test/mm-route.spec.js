
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
        expect(mmRoute).to.not.equal(void 0);
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
      expect(test).to.throw();
    });

    methods.forEach(function (method) {
      it('should have a ' + method + ' method', function () {
        expect(typeof provider[method]).to.equal('function');
      });
    });
  });

  describe('mmRoute service', function () {

    // By setting a default route any request to a URL not otherwise matched to
    // a route should be redirected to the default
    it('should allow a default route to be defined', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setDefaultRoute('/404');
        expect(mmRouteProvider.defaultUrl).to.equal('/404');
      });
      angular.mock.inject(function ($route, mmRoute) {
        expect(mmRoute.defaultUrl).to.equal('/404');
        expect($route.routes[null].redirectTo).to.equal('/404');
      });
    });

    // By setting a base route any request to the root should be redirected to
    // the specified base route URL
    it('should allow a base route to be defined', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setBaseRoute('/home');
      });
      angular.mock.inject(function ($route) {
        expect($route.routes['/'].redirectTo).to.equal('/home');
      });
    });

    // Simple (non-nested) routes can be accessed by simply providing the name
    it('should allow the retrieval of URLs', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings')).to.equal('/settings');
      });
    });

    it('should return undefined for undefined routes', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; } );
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('profile')).to.equal(undefined);
      });
    });

    // Nested routes are accessed by concatenating the names with '.', as if
    // you were accessing the property in code directly
    it('should allow the retrieval of a URL from a nested route', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          profile: {
            settings: {
              url: '/settings',
              access: [
                {
                  view: {},
                  roles: ['ALL']
                }
              ]
            }
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('profile.settings')).to.equal('/settings');
      });
    });

    it('should allow for a retrieval of URL with multiple roles', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: ['ADMIN']
              },
              {
                view: {},
                roles: ['TEACHER']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('settings')).to.equal('/settings');
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
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user', {
          userId: '12345',
          other: '6789'
        })).to.equal('/users/12345');
      });
    });

    it('should greedily match interpolated parts marked with *', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:user*',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user', {
          userId: '12345'
        })).to.equal('/users/12345');
      });
    });

    it('should allow optional interpolation parts marked with ?', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
        mmRouteProvider.setRoutes({
          user: {
            url: '/users/:userId?',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute.get('user')).to.equal('/users/');
        expect(mmRoute.get('user', {
          userId: '12345'
        })).to.equal('/users/12345');
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
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        });
      });
      angular.mock.inject(function ($location, mmRoute) {
        sinon.spy($location, 'url');
        mmRoute.goTo('settings');
        expect($location.url.calledWith('/settings')).to.equal(true);
      });
    });

    //If the route that the user wants to access is not accessible to all, the user is directed to a
    //template containing the role-resolver directive
    it('should redirect to role-resolver directive if view is not accessible to all ', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute._parseUrls({
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: [ 'ADMIN' ]
              }
            ]
          }
        })).to.deep.equal(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
              }
            }
          ]
        );
      });
    });

    it('should redirect nested routes to role-resolver directive if view is not accessible to all ', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute._parseUrls({
          home: {
            settings: {
              url: '/settings',
              access: [
                {
                  view: {},
                  roles: [ 'ADMIN' ]
                }
              ]
            }
          }
        })).to.deep.equal(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
              }
            }
          ]
        );
      });
    });

    //If the route is accessible to all, the template associated with that route should be rendered
    it('should not redirect to role-resolver directive if view is accessible to all ', function () {
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute._parseUrls({
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        })).to.deep.equal(
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
      angular.mock.module(function (mmRouteProvider) {
        mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN' ]; });
      });
      angular.mock.inject(function (mmRoute) {
        expect(mmRoute._parseUrls({
          home: {
            settings: {
              url: '/settings',
              access: [
                {
                  view: {},
                  roles: [ 'ADMIN' ]
                }
              ]
            }
          },
          settings: {
            url: '/settings',
            access: [
              {
                view: {},
                roles: ['ALL']
              }
            ]
          }
        })).to.deep.equal(
          [
            {
              url: '/settings',
              routeConf: {
                template: '<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>',
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
      angular.mock.inject(function (mmRoleResolver) {
        expect(mmRoleResolver).to.not.equal(void 0);
      });
    });

    describe('#_checkViewPermission', function () {

      // The role-resolver is able to determine whether a view can be accessed by a user
      // with a particular role
      it('should return true for a role that exists', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver._checkViewPermission('ADMIN')).to.equal(true);
        });
      });

      it('should return false for a role that does not exist', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver._checkViewPermission('PUPIL')).to.equal(false);
        });
      });

      it('should return true for a valid array of roles', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver._checkViewPermission(['ADMIN', 'TEACHER'])).to.equal(true);
        });
      });

      it('should return false for an invalid array of roles', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'PUPIL', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver._checkViewPermission(['ADMIN', 'TEACHER'])).to.equal(false);
        });
      });

    });

    describe('#chooseView', function () {
      // Role-resolver finds the first view that matches one of the roles of the user
      it('should return the view that matches a role', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'PUPIL', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver.chooseView(
            [
              {
                roles: ['ADMIN'],
                view: 'admin'
              },
              {
                roles: ['TEACHER'],
                view: 'teacher'}
             ]
          )).to.equal('teacher');
        });
      });

      it('should return the first valid match', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ADMIN', 'TEACHER' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver.chooseView(
            [
              {
                roles: ['ADMIN'],
                view: 'admin'
              },
              {
                roles: ['TEACHER'],
                view: 'teacher'
              }
            ]
          )).to.equal('admin');
        });
      });

      it('should return null if no match is found', function () {
        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return [ 'ROGUE' ]; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver.chooseView(
              [
                {
                  roles: ['ADMIN'],
                  view: 'admin'
                },
                {
                  roles: ['TEACHER'],
                  view: 'teacher'
                }
              ]
            )
          ).to.equal(null);
        });
      });

      // Role-resolver is able to call roleGetter that makes use of the $window service
      it('should be able to invoke $window when calling getRoles', function () {

        var windowMock = {
          currentUser: {
            roles: ['ADMIN']
          }
        };
        angular.mock.module(function (mmRouteProvider, $provide) {
          $provide.value('$window', windowMock);
          mmRouteProvider.setRoleGetter(function ($window) { return $window.currentUser.roles; });
        });
        angular.mock.inject(function (mmRoleResolver) {
          expect(mmRoleResolver.chooseView(
            [
              {
                roles: ['ADMIN'],
                view: 'admin'
              }
            ])).to.equal('admin');
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

        angular.mock.module(function ($provide) {
          $provide.value('$route', routeMock);
        });

        angular.mock.inject(function (mmRoleResolver, $route) {
          mmRoleResolver.updateCurrentRoute({
            abc: 123,
          });
          expect($route.current.$$route.abc).to.equal(123);
        });
      });

      it('should not override properties already set', function () {
        routeMock.current.$$route.abc = 'abc';

        angular.mock.module(function ($provide) {
          $provide.value('$route', routeMock);
        });

        angular.mock.inject(function (mmRoleResolver, $route) {
          mmRoleResolver.updateCurrentRoute({
            abc: 123,
          });
          expect($route.current.$$route.abc).to.equal('abc');
        });
      });

    });

    // Role-resolver is able to compile the template that correpond to the roles of the current user
    describe('compiling the template', function () {

      it('should redirect to the default url if no view matching roles was found', function () {

        angular.mock.module(function (mmRouteProvider) {
          mmRouteProvider.setRoleGetter(function () { return ['USER']; });
          mmRouteProvider.setDefaultRoute('/default');
        });

        angular.mock.inject(function (mmRoleResolver, $compile, $rootScope, $location) {
          $location.path('/settings');
          var element = angular.element('<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{"controller":"controller"},"roles":["ADMIN"]}]}\'></mm-role-resolver>');
          $compile(element)($rootScope);
          $rootScope.$digest();
          expect($location.path()).to.equal('/default');
        });
      });

      it('should compile without errors with a valid template', function () {

        var httpMock = {
          get: function () {
            return {
              then: function (fun) {
                return fun({ data: 'data' });
              }
            };
          }
        };

        var controllerMock = angular.noop;

        angular.mock.module(function (mmRouteProvider, $provide) {
          $provide.value('$http', httpMock);
          $provide.value('$controller', controllerMock);
          mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; });
        });

        angular.mock.inject(function (mmRoleResolver, $compile, $rootScope) {
          var element = angular.element('<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{"controller":"controller"},"roles":["ADMIN"]}]}\'></mm-role-resolver>');
          var compiled = $compile(element)($rootScope);
          expect(compiled.children().html()).to.equal('data');
        });
      });

      it('should compile without errors without a controller', function () {

        var httpMock = {
          get: function () {
            return {
              then: function (fun) {
                return fun({ data: 'data' });
              }
            };
          }
        };

        angular.mock.module(function (mmRouteProvider, $provide) {
          $provide.value('$http', httpMock);
          mmRouteProvider.setRoleGetter(function () { return ['ADMIN']; });
        });

        angular.mock.inject(function (mmRoleResolver, $compile, $rootScope) {
          var element = angular.element('<mm-role-resolver route=\'{"url":"/settings","access":[{"view":{},"roles":["ADMIN"]}]}\'></mm-role-resolver>');
          var compiled = $compile(element)($rootScope);
          expect(compiled.children().html()).to.equal('data');
        });
      });
    });
  });
});
