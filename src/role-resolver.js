angular.module('mmRoute')
.factory('mmRoleResolver', function ( $window, $injector, $route, mmRoute ) {

  function checkTemplatePermission( accessRole ) {
    var roles = $injector.invoke(mmRoute.roleGetter, $window);

    if ( !Array.isArray(accessRole) ) {
      return roles.indexOf(accessRole) !== -1;
    } else {
      return accessRole.every(function ( singleRole ) {
        return roles.indexOf(singleRole) !== -1;
      });
    }
  }

  function chooseTemplate( accessObjects ) {
    var chosenTemplate = null;

    for ( var i = 0; i < accessObjects.length; i++ ) {
      var accessObject = accessObjects[ i ];
      if ( accessObject.roles.some(checkTemplatePermission) ) {
        chosenTemplate = accessObject.page;
        break;
      }
    }

    if ( !chosenTemplate ) {
      throw new Error();
    }

    return chosenTemplate;

  }

  function updateCurrentRoute ( chosenTemplate ) {
    if ( $route.current && chosenTemplate ) {
      Object.keys(chosenTemplate).forEach(function ( key ) {
        if ( !$route.current.$$route[ key ] ) {
          $route.current.$$route[ key ] = chosenTemplate[ key ];
        }
      });
    }
  }

  return {
    chooseTemplate: chooseTemplate,
    updateCurrentRoute: updateCurrentRoute,
    _checkTemplatePermission: checkTemplatePermission,
  };

})
.directive('mmRoleResolver', function ( $http, $compile, $templateCache, $controller, $location, mmRoute, mmRoleResolver  ) {
  return {
    restrict: 'E',
    scope: {
      route: '=',
    },
    link: function ( scope, element ) {
      var chosenTemplate;
      try {
        chosenTemplate = mmRoleResolver.chooseTemplate(scope.route.access);
      }
      catch ( err ) {
        $location.path('/404');
      }

      mmRoleResolver.updateCurrentRoute(chosenTemplate);

      var parsedUrl = chosenTemplate.templateUrl;
      var controllerName = chosenTemplate.controller;

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
  };
});
