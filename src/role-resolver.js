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
    if ( $route.current && chosenView ) {
      Object.keys(chosenView).forEach(function ( key ) {
        if ( !$route.current.$$route[ key ] ) {
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
.directive('mmRoleResolver', function ( $http, $compile, $templateCache, $controller, $location, mmRoute, mmRoleResolver  ) {
  return {
    restrict: 'E',
    scope: {
      route: '=',
    },
    link: function ( scope, element ) {
      var chosenView = mmRoleResolver.chooseView(scope.route.access);
      if ( !chosenView ) {
        $location.path(mmRoute.defaultUrl);
      } else {

        mmRoleResolver.updateCurrentRoute(chosenView);

        var parsedUrl = chosenView.templateUrl;
        var controllerName = chosenView.controller;

        $http.get(parsedUrl, { cache: $templateCache })
        .then(function ( template ) {
          var templateScope = scope.$new();
          element.html(template.data);
          if ( controllerName ) {
            var templateCtrl = $controller(controllerName, { $scope: templateScope });
            element.children().data('$ngControllerController', templateCtrl);
          }
          $compile(element.contents())(templateScope);
        });
      }
    }
  };
});
