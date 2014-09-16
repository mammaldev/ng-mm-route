# ng-mm-route

An AngularJS module that creates a simple mechanism for robust role-based
routing. The `mm.route` module contains a single provider named
`mmRouteProvider` which in turn provides an `mmRoute` factory.

## Installation

The module is available through Bower. You can install it by running `bower
install ng-mm-route`. Once you've got the code you'll need to add the module as
a dependency to your app:

```js
angular.module('YourApp', [
  'mm.route'
]);
```

## Configuration

The module is configured via the `mmRouteProvider`. Like any provider this can
be injected into a module `config` function. The provider exposes a number of
methods:

#### `mmRouteProvider.setDefaultRoute('/404')`

Set a URL to which the browser will be redirected in the event of a request to a
URL that does not match a route definition. This method accepts a single
argument which should always be a string.

#### `mmRouteProvider.setBaseRoute('/home')`

Set a URL to which the browser will be redirected when a request is made to the
root URL. This is useful when your homepage is not found at the root URL. This
method accepts a single argument which should always be a string.

#### `mmRouteProvider.setRoles([ 'admin' ])`

Set the roles available to the *active user*. Usually you'd get this information
from the server and output it into your page. The roles available will be used
to determine which route definition (if any) should be used. This method accepts
a single argument which should always be an array of strings.

#### `mmRouteProvider.setRoutes({ /* ... */ })`

Set the routes available throughout the app. This method accepts a single
argument which should always be an object. See the Route definitions section for
more detail on the format of the object.

## Route definitions

Your route definitions are how you associate a URL with a view (and often a
controller). The `mm.route` module makes it easy to add user roles into the
equation. The object passed to `mmRouteProvider.setRoutes` should have keys
corresponding to user roles at the top level. Here's an example:

```js
var routes = {
  admin: {
    profile: {
      view: {
        url: '/admin-profile',
        templateUrl: '/templates/admin-profile.html'
      },
      edit: {
        url: '/profile/:userId/edit',
        templateUrl: 'templates/edit-profile.html'
      }
    }
  },
  user: {
    signup: {
      url: '/signup',
      templateUrl: '/templates/signup.html'
    },
    profile: {
      view: {
        url: '/profile',
        templateUrl: '/templates/user-profile.html'
      }
    }
  }
};
```

### Simple route definitions

In this example we define two roles of `admin` and `user`. The `signup` route
under the `user` role is a simple, single-level route definition. If we ask for
the `signup` route and the active user has the `user` role we will receive the
relevant route object or URL.

The format of the route definition object itself is identical to that used by
the [`ngRoute`][ngroute] module. In fact, `mm.route` relies upon `ngRoute` under
the hood which means you have a familiar and easy-to-migrate route setup.

### Grouped route definitions

The `profile.view` and `profile.edit` routes under the `admin` role demonstrates
the ability to group routes under related pieces of business logic. If the
active user has the `admin` role and we request the `profile.edit` route we will
receive the relevant route object or URL.

### Interpolation

The `profile.edit` route under the `admin` role demonstrates the ability to
interpolate data into the route URL. Dynamic portions of the URL are indicated
by a colon and a name. You'll see how to provide data to the route in the
mmRoute factory section.

## The `mmRoute` factory

The `mmRouteProvider` provides the `mmRoute` factory. When injected into a
controller, for example, the `mmRoute` factory will provide you with some
methods that can be used to facilitate routing within your app:

#### `mmRoute.get('profile.view')`

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

And finally, in the event that a user has multiple roles and you request a route
that is defined under more than one of those roles, you can specify which role
should take precedence (note that the role can be the second or third argument,
depending on whether a data object is specified as the second):

```js
// Returns '/profile' even if the user has the 'admin' role
mmRoute.get('profile.view', 'user');
```

[ngroute]: https://docs.angularjs.org/api/ngRoute
