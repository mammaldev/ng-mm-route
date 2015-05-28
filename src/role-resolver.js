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
