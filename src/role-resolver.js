angular.module('mmRoute')
.factory('mmRoleResolver', function ( $window, $injector, mmRoute ) {
  
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
      chosenTemplate = { templateUrl: '404' };
    } 

    return chosenTemplate;
      
  }

  return {
    chooseTemplate: chooseTemplate,
    _checkTemplatePermission: checkTemplatePermission
  }; 

})
.directive('mmRoleResolver', function ( $http, $compile, $templateCache, $controller, mmRoute, mmRoleResolver  ) {
  return {
    restrict: 'E',
    scope: {
      route: '=',
    },
    link: function ( scope, element ) {
      var chosenTemplate = mmRoleResolver.chooseTemplate(scope.route.access);
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
