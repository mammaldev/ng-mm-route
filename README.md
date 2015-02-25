# ng-mm-route

An AngularJS module that creates a simple mechanism for robust role-based
routing. The `mmRoute` module contains a single provider named `mmRouteProvider`
which in turn provides an `mmRoute` factory.


## Installation

The module is available through Bower. You can install it by running `bower
install ng-mm-route`. Once you've got the code you'll need to add the module as
a dependency to your app:

```js
angular.module('YourApp', [
  'mmRoute'
]);
```

## Configuration

The module is configured via the `mmRouteProvider`. Like any provider this can
be injected into a module `config` function. The provider exposes a number of
methods:

#### setDefaultRoute

Example: `mmRouteProvider.setDefaultRoute('/404')`

Set a URL to which the browser will be redirected in the event of a request to a
URL that does not match a route definition. This method accepts a single
argument which should always be a string.

#### setBaseRoute

Example: `mmRouteProvider.setBaseRoute('/home')`

Set a URL to which the browser will be redirected when a request is made to the
root URL. This is useful when your homepage is not found at the root URL. This
method accepts a single argument which should always be a string.

#### setRoleGetter

Example: `mmRouteProvider.setRoleGetter(function() { return [ 'admin' ] })`

Set a function that returns the roles available to the *active user*. Usually 
you'd get this information from the server and output it into your page. The 
roles available will be used to determine which route definition (if any) should 
be used. This method accepts a single argument which should always be a function 
returning an array of strings.

#### setRoutes

Example: `mmRouteProvider.setRoutes({ /* ... */ })`

Set the routes available throughout the app. This method accepts a single
argument which should always be an object. See the Route definitions section for
more detail on the format of the object.

## Route definitions

Your route definitions describe how you associate a URL with a view (and often a
controller). The `mmRoute` module makes it easy to add user roles into the
equation. The object passed to `mmRouteProvider.setRoutes` should have keys
corresponding to the pages to be accessed at the top level, and an array of 
roles associated with that page at a lower level. Here's an example:

```js
var routes = {
  profile: {
    view: {
      url: '/profile', 
      access: [
        {
          view: {
            templateUrl: '/templates/user-profile.html'
          }, 
          roles: [
            'ADMIN'
          ]
        }, 
        {
          view: {
            templateUrl: '/templates/user-profile.html'
          }, 
          roles: [
            'USER'
          ]
        }
    }, 
    edit: {
      url: '/profile/:userId/edit', 
      access: [
        { 
          view: {
            templateUrl: '/templates/edit-profile.html'
          }, 
          roles: [
            'ADMIN'
          ]
        }
      ]
    }
  }, 
  signup: {
    url: '/signup', 
    access: [
      {
        view: {
          templateUrl: '/signup/'
        },
        roles:[
          'USER'
        ]
      }
    ]
  }
}
```

### Route definitions

In this example we define four pages, `profile.view`, `profile.edit` and 
`signup`. The access information for these roles is specified in the associated 
access object. The access object contains a page element, and an array of the 
roles that are able to access that page. If the role array contains an array of 
roles instead of a single role, then the user must have both of these roles to 
be matched with the corresponding page. 

For example, the `signup` route under the `user` role is a simple, single-level 
route definition. If we ask for the `signup` route and the active user has the 
`user` role we will receive the relevant route object or URL. The page-element 
with a role that matches the roles of the user will be matched.

The `profile.view` and `profile.edit` routes demonstrates the ability to group 
routes under related pieces of business logic. If the active user has the 
`admin` role and we request the `profile.edit` route, we will receive the 
relevant route object or URL.

If a page has the role `ALL` in its roles, then that page is available for all
users. `ALL` should always be the only element in the roles array.

`mmRoute` relies upon `ngRoute` under
the hood which means you have a familiar and easy-to-migrate route setup.

### Interpolation

The `profile.edit` route under the `admin` role demonstrates the ability to
interpolate data into the route URL. Dynamic portions of the URL are indicated
by a colon and a name. You'll see how to provide data to the route in the
mmRoute factory section.

## The `mmRoute` factory

The `mmRouteProvider` provides the `mmRoute` factory. When injected into a
controller, for example, the `mmRoute` factory will provide you with some
methods that can be used to facilitate routing within your app:

#### get

Example: `mmRoute.get('profile.view', data)`

Get the URL associated with a given route. Given the route definitions above,
this call would return `'/admin-profile'` if the active user had the `admin`
role.

By attaching this method to an Angular scope object (with `$scope.routes =
mmRoute` for example) you'll be able to access it in your templates:

```html
<a href="{{ routes.get('profile.view') }} ">View your profile</a>
```

If the route in question requires data for interpolation you can pass an object
as the second argument to `mmRoute.get`:

```js
// Returns '/profile/5/edit' for a user with the 'admin' role
mmRoute.get('profile.edit', { userId: 5 });
```

In the event that a user has multiple roles and you request a route
that is defined under more than one of those roles, the first page element in the 
array of page elements
that has a role matching the roles that the user has will be matched.

#### goTo

Example: `mmRoute.goTo('profile.view', data)`

Redirect the browser (via the AngularJS `$location` service) to the URL
associated with the provided route. This method accepts the same arguments as
the `mmRoute.get` method and behaves in the same way.

[ngroute]: https://docs.angularjs.org/api/ngRoute
