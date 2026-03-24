================
CODE SNIPPETS
================
TITLE: Setup Laravel Project and Install Spatie Permissions
DESCRIPTION: This snippet guides through creating a new Laravel project, configuring it for SQLite, installing the spatie/laravel-permission package, publishing its assets, and running migrations. It also includes steps for Git initialization and environment variable setup.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: sh
CODE:

```
cd ~\/Sites
laravel new mypermissionsdemo
# (No Starter Kit is needed, but you could go with Livewire or Breeze/Jetstream, with Laravel's Built-In-Auth; or use Bootstrap using laravel\/ui described later, below)
# (You might be asked to select a dark-mode-support choice)
# (Choose your desired testing framework: Pest or PHPUnit)
# (If offered, say Yes to initialize a Git repo, so that you can track your code changes)
# (If offered a database selection, choose SQLite, because it is simplest for test scenarios)
# (If prompted, say Yes to run default database migrations)
# (If prompted, say Yes to run npm install and related commands)

cd mypermissionsdemo

# The following git commands are not needed if you Initialized a git repo while "laravel new" was running above:
git init
git add .
git commit -m "Fresh Laravel Install"

# These Environment steps are not needed if you already selected SQLite while "laravel new" was running above:
cp -n .env.example .env
sed -i '' 's/DB_CONNECTION=mysql/DB_CONNECTION=sqlite/' .env
sed -i '' 's/DB_DATABASE=/#DB_DATABASE=/' .env
touch database\/database.sqlite

# Package
composer require spatie\/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
git add .
git commit -m "Add Spatie Laravel Permissions package"
php artisan migrate:fresh
```

---

TITLE: Setup Laravel Auth Scaffolding
DESCRIPTION: This snippet shows how to install Laravel's basic authentication scaffolding using laravel\/ui with Bootstrap. This is useful for providing login capabilities to test roles and permissions. It includes composer require, UI command, and Git commit.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: php
CODE:

```
composer require laravel\/ui --dev
php artisan ui bootstrap --auth
# npm install && npm run build
git add .
git commit -m "Setup auth scaffold"
```

---

TITLE: Install spatie/laravel-permission via Composer
DESCRIPTION: Installs the spatie/laravel-permission package using Composer. This is the primary method for adding the package to your Laravel project.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-laravel.md

LANGUAGE: shell
CODE:

```
composer require spatie/laravel-permission
```

---

TITLE: Copy Package Files for Lumen
DESCRIPTION: Copies necessary configuration and migration files from the installed package to your Lumen project's directories. This includes the permission configuration file and the migration stub for creating permission tables.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: bash
CODE:

```
mkdir -p config
cp vendor/spatie/laravel-permission/config/permission.php config/permission.php
cp vendor/spatie/laravel-permission/database/migrations/create_permission_tables.php.stub database/migrations/2018_01_01_000000_create_permission_tables.php
```

---

TITLE: Run Database Migrations
DESCRIPTION: Executes all pending database migrations, including those published by the spatie/laravel-permission package. This creates the necessary tables for managing roles and permissions in your database.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-laravel.md

LANGUAGE: shell
CODE:

```
php artisan migrate
```

---

TITLE: Run Database Migrations
DESCRIPTION: Executes pending database migrations to create the necessary tables for the spatie/laravel-permission package, such as tables for roles, permissions, and their associations.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: bash
CODE:

```
php artisan migrate
```

---

TITLE: User Model Setup with HasRoles Trait
DESCRIPTION: Demonstrates the minimum requirements for a User model to integrate with the Spatie Laravel Permission package. It requires implementing the Authorizable contract and using the HasRoles trait.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/prerequisites.md

LANGUAGE: php
CODE:

```
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;

    // ...
}
```

---

TITLE: Publish Package Assets
DESCRIPTION: Publishes the package's migration files and configuration file to your Laravel project. This command makes the database schema and configuration options accessible for customization.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-laravel.md

LANGUAGE: shell
CODE:

```
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

---

TITLE: Install Spatie Laravel Permission via Composer
DESCRIPTION: Installs the spatie/laravel-permission package using Composer. This is the primary step to add the package to your Lumen project.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: bash
CODE:

```
composer require spatie/laravel-permission
```

---

TITLE: Basic Git Commands for Sharing
DESCRIPTION: Provides essential Git commands for initializing a remote repository and pushing local changes to GitHub. These commands are fundamental for sharing project code.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: bash
CODE:

```
git remote add origin git@github.com:YOURUSERNAME/REPONAME.git
git push -u origin main
```

LANGUAGE: bash
CODE:

```
git add .
git commit -m "Explain what your commit is about here"
git push origin main
```

---

TITLE: Copy Lumen Auth Configuration
DESCRIPTION: Copies the default Lumen authentication configuration file if it does not exist in your project. This ensures proper integration with Lumen's authentication system.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: bash
CODE:

```
cp vendor/laravel/lumen-framework/config/auth.php config/auth.php
```

---

TITLE: Enable Auth Service Provider in bootstrap/app.php
DESCRIPTION: Uncomments the AuthServiceProvider registration in `bootstrap/app.php`. This is necessary for Lumen's authorization layer, which relies on guards.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: php
CODE:

```
$app->register(App\Providers\AuthServiceProvider::class);
```

---

TITLE: Example Team Middleware for Permissions
DESCRIPTION: Provides an example of a custom middleware that sets the global `team_id` based on session data or other custom logic. This ensures that subsequent permission checks are scoped to the correct team.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/teams-permissions.md

LANGUAGE: php
CODE:

```
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TeamsPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(Request): (Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!empty(auth()->user())) {
            // session value set on login
            setPermissionsTeamId(session('team_id'));
        }
        // other custom ways to get team_id
        /*if(!empty(auth('api')->user())){
            // `getTeamIdFromToken()` example of custom method for getting the set team_id
            setPermissionsTeamId(auth('api')->user()->getTeamIdFromToken());
        }*/

        return $next($request);
    }
}
```

---

TITLE: Eloquent Relationships and Queries
DESCRIPTION: Shows how to leverage Eloquent relationships for querying users with their roles and permissions. Includes examples for eager loading and filtering users without roles.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
$allUsersWithRoles = User::with('roles')->get();
$allUsersWithDirectPermissions = User::with('permissions')->get();
$allRoles = Role::all()->pluck('name');
$usersWithoutRoles = User::doesntHave('roles')->get();
$rolesExceptAandB = Role::whereNotIn('name', ['role A', 'role B'])->get();
```

---

TITLE: Use Package Middleware in Routes
DESCRIPTION: Provides examples of applying the registered 'role', 'permission', and 'role_or_permission' middleware to route groups. Demonstrates single/multiple role/permission checks and guard specification.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
Route::group(['middleware' => ['role:manager']], function () { ... });
Route::group(['middleware' => ['permission:publish articles']], function () { ... });
Route::group(['middleware' => ['role_or_permission:publish articles']], function () { ... });

// for a specific guard:
Route::group(['middleware' => ['role:manager,api']], function () { ... });

// multiple middleware
Route::group(['middleware' => ['role:manager','permission:publish articles']], function () { ... });

// Multiple roles or permissions with '|' (OR):
Route::group(['middleware' => ['role:manager|writer']], function () { ... });
Route::group(['middleware' => ['permission:publish articles|edit articles']], function () { ... });
Route::group(['middleware' => ['role_or_permission:manager|edit articles']], function () { ... });

// for a specific guard with multiple permissions:
Route::group(['middleware' => ['permission:publish articles|edit articles,api']], function () { ... });
```

---

TITLE: Laravel Model Policy Example
DESCRIPTION: An example of a Laravel Model Policy for controlling access to Post model records. It defines methods like 'view', 'create', 'update', and 'delete', demonstrating how to check user permissions and ownership to grant or deny access.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/best-practices/using-policies.md

LANGUAGE: php
CODE:

```
<?php
namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PostPolicy
{
    use HandlesAuthorization;

    public function view(?User $user, Post $post): bool
    {
        if ($post->published) {
            return true;
        }

        // visitors cannot view unpublished items
        if ($user === null) {
            return false;
        }

        // admin overrides published status
        if ($user->can('view unpublished posts')) {
            return true;
        }

        // authors can view their own unpublished posts
        return $user->id == $post->user_id;
    }

    public function create(User $user): bool
    {
        return $user->can('create posts');
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->can('edit all posts')) {
            return true;
        }

        if ($user->can('edit own posts')) {
            return $user->id == $post->user_id;
        }
    }

    public function delete(User $user, Post $post): bool
    {
        if ($user->can('delete any post')) {
            return true;
        }

        if ($user->can('delete own posts')) {
            return $user->id == $post->user_id;
        }
    }
}
```

---

TITLE: Clear Configuration Cache
DESCRIPTION: Clears the cached configuration files. This is a crucial step after publishing or modifying configuration files to ensure the application uses the latest settings, especially for package-specific configurations.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-laravel.md

LANGUAGE: shell
CODE:

```
php artisan optimize:clear
# or
php artisan config:clear
```

---

TITLE: Create Roles and Permissions Seeder (PHP)
DESCRIPTION: This PHP code defines a Laravel seeder to create initial roles ('writer', 'admin', 'Super-Admin') and permissions ('edit articles', 'delete articles', 'publish articles', 'unpublish articles'). It assigns permissions to roles and roles to demo users, demonstrating basic usage of the spatie/laravel-permission package.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: php
CODE:

```
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionsDemoSeeder extends Seeder
{
    /**
     * Create the initial roles and permissions.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'edit articles']);
        Permission::create(['name' => 'delete articles']);
        Permission::create(['name' => 'publish articles']);
        Permission::create(['name' => 'unpublish articles']);

        // create roles and assign existing permissions
        $role1 = Role::create(['name' => 'writer']);
        $role1->givePermissionTo('edit articles');
        $role1->givePermissionTo('delete articles');

        $role2 = Role::create(['name' => 'admin']);
        $role2->givePermissionTo('publish articles');
        $role2->givePermissionTo('unpublish articles');

        $role3 = Role::create(['name' => 'Super-Admin']);
        // gets all permissions via Gate::before rule; see AuthServiceProvider

        // create demo users
        $user = \App\Models\User::factory()->create([
            'name' => 'Example User',
            'email' => 'tester@example.com',
        ]);
        $user->assignRole($role1);

        $user = \App\Models\User::factory()->create([
            'name' => 'Example Admin User',
            'email' => 'admin@example.com',
        ]);
        $user->assignRole($role2);

        $user = \App\Models\User::factory()->create([
            'name' => 'Example Super-Admin User',
            'email' => 'superadmin@example.com',
        ]);
        $user->assignRole($role3);
    }
}

```

---

TITLE: Clear Permission Cache in Test Setup
DESCRIPTION: Ensures roles and permissions are registered correctly in tests by clearing the permission cache within the PHPUnit setUp() method. This is crucial when roles/permissions are created after the initial gate registration.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/testing.md

LANGUAGE: PHP
CODE:

```
use Spatie\Permission\PermissionRegistrar;

protected function setUp(): void
{
    parent::setUp();

    // Clear the permission cache
    $this->app->make(PermissionRegistrar::class)->forgetCachedPermissions();
}
```

---

TITLE: Use Package Middleware in Controllers (Laravel 10-)
DESCRIPTION: Demonstrates registering middleware within a controller's constructor for older Laravel versions. Includes examples for single/multiple roles/permissions and specific guards.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
public function __construct()
{
    // examples:
    $this->middleware(['role:manager','permission:publish articles|edit articles']);
    $this->middleware(['role_or_permission:manager|edit articles']);
    // or with specific guard
    $this->middleware(['role_or_permission:manager|edit articles,api']);
}
```

---

TITLE: Route Protection with Role or Permission Middleware
DESCRIPTION: Demonstrates how to protect routes using the `role_or_permission` middleware. This middleware ensures that only users with the specified role or permission can access the route.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: php
CODE:

```
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Protected route example:
Route::middleware('role_or_permission:publish articles')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
```

---

TITLE: Count Users by Role
DESCRIPTION: An example of counting users who possess a specific role by filtering a collection of users that have their roles eagerly loaded.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
$managersCount = User::with('roles')->get()->filter(
    fn ($user) => $user->roles->where('name', 'Manager')->toArray()
)->count();
```

---

TITLE: Register Middleware in bootstrap/app.php
DESCRIPTION: Registers custom middleware for authentication and permissions within the Lumen application. This involves cloning middleware from the package and updating their calls to Lumen-compatible methods.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: php
CODE:

```
$app->routeMiddleware([
    'auth'       => App\Http\Middleware\Authenticate::class,
    'permission' => App\Http\Middleware\PermissionMiddleware::class, // cloned from Spatie\Permission\Middleware
    'role'       => App\Http\Middleware\RoleMiddleware::class,  // cloned from Spatie\Permission\Middleware
]);
```

---

TITLE: Register Package Services in bootstrap/app.php
DESCRIPTION: Registers the package's configuration, service provider, and cache alias in the Lumen application's bootstrap file. This makes the package's features available throughout the application.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: php
CODE:

```
$app->configure('permission');
$app->alias('cache', \Illuminate\Cache\CacheManager::class);  // if you don't have this already
$app->register(Spatie\Permission\PermissionServiceProvider::class);
```

---

TITLE: Blade Authorization with @can Directive
DESCRIPTION: Shows how to conditionally render content in Blade views based on user permissions. The `@can` directive checks if the authenticated user has a specific permission.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: blade
CODE:

```
<div class="p-6 text-gray-900">
    {{ __("You're logged in!") }}
</div>
@can('edit articles')
    You can EDIT ARTICLES.
@endcan
@can('publish articles')
    You can PUBLISH ARTICLES.
@endcan
@can('only super-admins can see this section')
    Congratulations, you are a super-admin!
@endcan
```

---

TITLE: Laravel Seeder for Roles and Permissions
DESCRIPTION: This example seeder class illustrates the recommended order for seeding roles and permissions. It includes flushing the cache before creating items, creating permissions, updating the cache, creating roles, and assigning permissions to those roles.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/seeding.md

LANGUAGE: php
CODE:

```
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()["Spatie\Permission\PermissionRegistrar::class"]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'edit articles']);
        Permission::create(['name' => 'delete articles']);
        Permission::create(['name' => 'publish articles']);
        Permission::create(['name' => 'unpublish articles']);

        // update cache to know about the newly created permissions (required if using WithoutModelEvents in seeders)
        app()["Spatie\Permission\PermissionRegistrar::class"]->forgetCachedPermissions();


        // create roles and assign created permissions

        // this can be done as separate statements
        $role = Role::create(['name' => 'writer']);
        $role->givePermissionTo('edit articles');

        // or may be done by chaining
        $role = Role::create(['name' => 'moderator'])
            ->givePermissionTo(['publish articles', 'unpublish articles']);

        $role = Role::create(['name' => 'super-admin']);
        $role->givePermissionTo(Permission::all());
    }
}
```

---

TITLE: Database Schema Index Lengths for MySQL
DESCRIPTION: Provides guidance on handling MySQL's index key length limitations, particularly with utf8mb4 character sets, which can affect compound indexes used by the package. Offers solutions like adjusting default string lengths or modifying migration fields.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/prerequisites.md

LANGUAGE: sql
CODE:

```
-- Example of adjusting string length in migration
$table->string('name', 166);
$table->string('guard_name', 25);
```

LANGUAGE: php
CODE:

```
// Example of setting default string length in AppServiceProvider
use Illuminate\Support\Facades\Schema;

public function boot()
{
    Schema::defaultStringLength(125);
}
```

---

TITLE: Migrate and Seed Database (Shell)
DESCRIPTION: This shell command refreshes the Laravel database migration and seeds it using the `PermissionsDemoSeeder`. It's used to apply the database schema changes and populate it with the initial roles, permissions, and users defined in the seeder.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: sh
CODE:

```
php artisan migrate:fresh --seed --seeder=PermissionsDemoSeeder
```

---

TITLE: User Model Implementation for Lumen
DESCRIPTION: Ensures the User model implements the `Authorizable` contract and uses the `Authorizable` trait, which is required by Laravel's authorization layer. Lumen does not support the `User::canAny()` method directly.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-lumen.md

LANGUAGE: php
CODE:

```
// In your User model (e.g., app/User.php)

use Illuminate\Contracts\Auth\Access\Authorizable;
use Laravel\Lumen\Auth\Authorizable as LumenAuthorizable;

class User extends Model implements Authorizable
{
    use LumenAuthorizable;

    // ... other model properties and methods
}
```

---

TITLE: Custom Model Syntax Update (v5 to v6)
DESCRIPTION: If you have overridden the `getPermissionClass()` or `getRoleClass()` methods or have custom Models, you need to update how you access these models. The example demonstrates accessing the model using the `::` static syntax instead of `->`.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/upgrading.md

LANGUAGE: php
CODE:

```
// Before (example):
// $this->permissionClass->create(...)
// After (example):
$this->permissionClass::create(...)
```

---

TITLE: Has Permission Blade Directives
DESCRIPTION: Provides directives to check for permissions, similar to @can, with corresponding start and end tags. Supports specifying a guard name.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/blade-directives.md

LANGUAGE: php
CODE:

```
@haspermission('permission-name')
    // User has the specified permission
@endhaspermission

@haspermission('permission-name', 'guard_name')
    // User has the specified permission using a specific guard
@endhaspermission
```

---

TITLE: Update spatie/laravel-permission via Composer
DESCRIPTION: This command updates the spatie/laravel-permission package to a new major version using Composer. It's crucial to first update your composer.json file to specify the desired version, for example, by setting it to '^6.0'.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/upgrading.md

LANGUAGE: bash
CODE:

```
composer update spatie/laravel-permission
```

---

TITLE: Laravel Seeder for Assigning Roles to Multiple Users
DESCRIPTION: This example shows how to create a specified number of users and then iterate through them to assign a role. It's an alternative to using factory states when you need to perform bulk assignments after user creation.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/seeding.md

LANGUAGE: php
CODE:

```
// Seeder:
User::factory()
    ->count(50)
    ->create()
    ->each(function ($user) {
        $user->assignRole('Member');
    });
```

---

TITLE: Database Cache Store Migration Prerequisite
DESCRIPTION: When using the 'database' cache store in Laravel (via `CACHE_STORE=database` in `.env`), it is crucial to install the necessary cache tables using migrations. Failure to do so can lead to errors when the cache store attempts to purge or update cache entries.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/cache.md

LANGUAGE: APIDOC
CODE:

```
Environment Variable:
  CACHE_STORE=database

Prerequisite:
  - Ensure Laravel's cache tables are installed via migration before performing any cache operations.
  - Command: `php artisan cache:table` (followed by migration execution).

Error Condition:
  - If migrations are not run, you may encounter errors like `Call to a member function perform() on null` when cache operations are triggered.
```

---

TITLE: Add HasRoles Trait to User Model
DESCRIPTION: This snippet demonstrates how to modify the app\/Models\/User.php file using sed to include the HasRoles trait from the spatie\/laravel-permission package. It covers variations for different use statements.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: sh
CODE:

```
# Add `HasRoles` trait to User model
sed -i '' $'s/use HasFactory, Notifiable;/use HasFactory, Notifiable;\
    use \\Spatie\\Permission\\Traits\\HasRoles;/' app\/Models\/User.php
sed -i '' $'s/use HasApiTokens, HasFactory, Notifiable;/use HasApiTokens, HasFactory, Notifiable;\
    use \\Spatie\\Permission\\Traits\\HasRoles;/' app\/Models\/User.php
git add .
git commit -m "Add HasRoles trait"
```

---

TITLE: Grant Super-Admin All Permissions (PHP)
DESCRIPTION: This PHP code snippet shows how to modify the `AuthServiceProvider` (or `AppServiceProvider`) in Laravel to grant all permissions to users with the 'Super-Admin' role. It uses `Gate::before` to implement a global check, allowing Super-Admins to bypass standard `can()` or `@can()` checks.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/new-app.md

LANGUAGE: php
CODE:

```
use Illuminate\Support\Facades\Gate;

    public function boot()
    {
        // Implicitly grant "Super-Admin" role all permission checks using can()
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('Super-Admin')) {
                return true;
            }
        });
    }

```

---

TITLE: Add HasRoles Trait to User Model
DESCRIPTION: Integrates the HasRoles trait into your application's User model. This trait provides the necessary methods and logic for assigning and managing roles and permissions to users.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/installation-laravel.md

LANGUAGE: php
CODE:

```
// The User model requires this trait
use HasRoles;
```

---

TITLE: Define PHP Enum for Roles
DESCRIPTION: Example of creating a PHP backed Enum for managing application roles. This Enum defines role names and includes a helper method for custom display labels.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/enums.md

LANGUAGE: PHP
CODE:

```
namespace App\Enums;

enum RolesEnum: string
{
    // case NAMEINAPP = 'name-in-database';

    case WRITER = 'writer';
    case EDITOR = 'editor';
    case USERMANAGER = 'user-manager';

    // extra helper to allow for greater customization of displayed values, without disclosing the name/value data directly
    public function label(): string
    {
        return match ($this) {
            static::WRITER => 'Writers',
            static::EDITOR => 'Editors',
            static::USERMANAGER => 'User Managers',
        };
    }
}
```

---

TITLE: PHP: Custom Permission Model with UUIDs
DESCRIPTION: Example PHP code for a custom Permission model that extends Spatie's Permission and implements Laravel's HasUuids trait. It sets the primary key to 'uuid' for UUID-based identification.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/uuid.md

LANGUAGE: php
CODE:

```
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    use HasFactory;
    use HasUuids;
    protected $primaryKey = 'uuid';
}
```

---

TITLE: PHP: Custom Role Model with UUIDs
DESCRIPTION: Example PHP code for a custom Role model that extends Spatie's Role and implements Laravel's HasUuids trait. It sets the primary key to 'uuid' for UUID-based identification.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/uuid.md

LANGUAGE: php
CODE:

```
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;
    use HasUuids;
    protected $primaryKey = 'uuid';
}
```

---

TITLE: Override getMorphClass for Child User Models
DESCRIPTION: Provides an example of overriding the getMorphClass method on a child User model. This is useful when a child model should inherit permissions/roles from its parent and not have its own independent permissions.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/extending.md

LANGUAGE: php
CODE:

```
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class ChildUser extends Authenticatable
{
    // ... other model properties and methods

    /**
     * Get the model's morph class.
     *
     * @return string
     */
    public function getMorphClass()
    {
        return 'users'; // Or the parent's morph class
    }
}

```

---

TITLE: Convert String IDs to Integers (v5 to v6)
DESCRIPTION: When upgrading from v5 to v6, package methods expecting a Permission or Role ID must receive an integer. This example shows how to convert an array of string IDs from a form submission into integers using Laravel's collection methods.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/upgrading.md

LANGUAGE: php
CODE:

```
collect($validated['permission'])->map(fn($val)=>(int)$val)
```

---

TITLE: Add Permissions to User
DESCRIPTION: Demonstrates how to grant specific permissions directly to a user instance using the `givePermissionTo` method.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/introduction.md

LANGUAGE: php
CODE:

```
// Adding permissions to a user
$user->givePermissionTo('edit articles');
```

---

TITLE: Run Package Tests
DESCRIPTION: This command executes the test suite for the spatie/laravel-permission package using Composer. It's essential for verifying the package's integrity and ensuring it functions correctly in your development environment.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/README.md

LANGUAGE: bash
CODE:

```
composer test
```

---

TITLE: Assign Role to User
DESCRIPTION: Shows how to assign a predefined role to a user instance using the `assignRole` method.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/introduction.md

LANGUAGE: php
CODE:

```
// Adding permissions via a role
$user->assignRole('writer');
```

---

TITLE: Apply Middleware via Static `using` Method
DESCRIPTION: Demonstrates how to apply Spatie Laravel Permission middleware (RoleMiddleware, PermissionMiddleware, RoleOrPermissionMiddleware) using their static 'using' methods. The 'using' method accepts either a single string, a pipe-separated string, or an array of roles/permissions.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
Route::group(['middleware' => [\Spatie\Permission\Middleware\RoleMiddleware::using('manager')]], function () { ... });
Route::group(['middleware' => [\Spatie\Permission\Middleware\PermissionMiddleware::using('publish articles|edit articles')]], function () { ... });
Route::group(['middleware' => [\Spatie\Permission\Middleware\RoleOrPermissionMiddleware::using(['manager', 'edit articles'])]], function () { ... });
```

---

TITLE: Grant Permission to Role
DESCRIPTION: Illustrates assigning a permission to a specific role instance using the `givePermissionTo` method.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/introduction.md

LANGUAGE: php
CODE:

```
$role->givePermissionTo('edit articles');
```

---

TITLE: Create Roles and Permissions
DESCRIPTION: Demonstrates how to create new roles and permissions using the package's Eloquent models. Both Role and Permission models require a 'name' attribute.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$role = Role::create(['name' => 'writer']);
$permission = Permission::create(['name' => 'edit articles']);
```

---

TITLE: Assign Permissions and Roles to Users
DESCRIPTION: Demonstrates how to grant specific permissions directly to a user or assign roles to a user. It also shows how to grant permissions to a role, which then applies to users with that role. These operations leverage the package's fluent interface for permission management.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/README.md

LANGUAGE: php
CODE:

```
$user->givePermissionTo('edit articles');

$user->assignRole('writer');

$role->givePermissionTo('edit articles');
```

---

TITLE: Create Wildcard Permissions
DESCRIPTION: Demonstrates how to create permissions using wildcard syntax, such as 'posts.\*' or 'posts.create.1'. These permissions must be created before they can be assigned or checked.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/wildcard-permissions.md

LANGUAGE: php
CODE:

```
Permission::create(['name'=>'posts.*']);
Permission::create(['name'=>'posts.create.1']);
```

---

TITLE: Retrieving User Permissions (PHP)
DESCRIPTION: Demonstrates methods to retrieve different categories of permissions for a user: direct permissions, permissions inherited via roles, and all applicable permissions combined.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
// Direct permissions
$user->getDirectPermissions() // Or $user->permissions;

// Permissions inherited from the user's roles
$user->getPermissionsViaRoles();

// All permissions which apply on the user (inherited and direct)
$user->getAllPermissions();
```

---

TITLE: Creating Permissions Performance
DESCRIPTION: Compares two methods for creating permissions in Laravel. Using `Permission::make()` followed by `saveOrFail()` can be more performant than `Permission::create()` in certain scenarios, especially with large databases or frequent operations.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/best-practices/performance.md

LANGUAGE: php
CODE:

```
Permission::create([
    attributes
]);
```

LANGUAGE: php
CODE:

```
$permission = Permission::make([
    attributes
]);
$permission->saveOrFail();
```

---

TITLE: Assigning Roles to Users (PHP)
DESCRIPTION: Demonstrates how to assign single or multiple roles to a user, and how to synchronize a user's roles. Roles can be assigned by name or by Role object.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
$user->assignRole('writer');

// You can also assign multiple roles at once
$user->assignRole('writer', 'admin');
// or as an array
$user->assignRole(['writer', 'admin']);

$user->removeRole('writer');

// All current roles will be removed from the user and replaced by the array given
$user->syncRoles(['writer', 'admin']);
```

---

TITLE: Assigning Permissions to Roles (PHP)
DESCRIPTION: Explains how to grant permissions to a role, revoke permissions from a role, and synchronize a role's permissions. Permissions can be specified by name or by Permission object.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
$role->givePermissionTo('edit articles');

$role->revokePermissionTo('edit articles');

// revoke & add new permissions in one go:
$role->syncPermissions(['edit articles', 'delete articles']);
```

---

TITLE: Package Methods Supporting BackedEnums
DESCRIPTION: Lists key methods within the spatie/laravel-permission package that accept BackedEnum objects directly for role and permission management, simplifying code and improving type safety.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/enums.md

LANGUAGE: APIDOC
CODE:

```
User & Role Assignment/Revocation:
  - $user->assignRole(RolesEnum::WRITER);
  - $user->removeRole(RolesEnum::EDITOR);
  - $role->givePermissionTo(PermissionsEnum::EDITPOSTS);
  - $role->revokePermissionTo(PermissionsEnum::EDITPOSTS);
  - $user->givePermissionTo(PermissionsEnum::EDITPOSTS);
  - $user->revokePermissionTo(PermissionsEnum::EDITPOSTS);
    - Description: Methods to assign or remove roles and permissions from users or roles using Enum objects.
    - Parameters: Accepts a single BackedEnum object or an array of BackedEnum objects.
    - Returns: Typically the User or Role model instance.

Permission & Role Checking:
  - $user->hasPermissionTo(PermissionsEnum::EDITPOSTS);
  - $user->hasAnyPermission([PermissionsEnum::EDITPOSTS, PermissionsEnum::VIEWPOSTS]);
  - $user->hasDirectPermission(PermissionsEnum::EDITPOSTS);
  - $user->hasRole(RolesEnum::WRITER);
  - $user->hasAllRoles([RolesEnum::WRITER, RolesEnum::EDITOR]);
  - $user->hasExactRoles([RolesEnum::WRITER, RolesEnum::EDITOR, RolesEnum::MANAGER]);
    - Description: Methods to check if a user possesses specific permissions or roles using Enum objects.
    - Parameters: Accepts a single BackedEnum object, an array of BackedEnum objects, or a string representing the permission/role name.
    - Returns: Boolean value indicating whether the user has the specified permission(s) or role(s).
```

---

TITLE: Artisan Commands for Creating Roles and Permissions
DESCRIPTION: These commands allow you to create roles and permissions directly from the console. You can specify guard names, link permissions to roles during creation, and set team IDs when teams are enabled.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/artisan.md

LANGUAGE: APIDOC
CODE:

```
Artisan Commands for Role and Permission Management:

php artisan permission:create-role <role_name> [guard_name] [permissions]
  - Creates a new role. Optionally specify the guard name and a pipe-separated list of permissions to create and assign.
  - Example: php artisan permission:create-role writer web "create articles|edit articles"

php artisan permission:create-permission <permission_name> [guard_name]
  - Creates a new permission. Optionally specify the guard name.
  - Example: php artisan permission:create-permission "edit articles" web

php artisan permission:create-role --team-id=<team_id> <role_name> [guard_name]
  - Creates a role and assigns it to a specific team.
  - Example: php artisan permission:create-role --team-id=1 writer
  - Example: php artisan permission:create-role writer api --team-id=1

Parameters:
  <role_name>: The name of the role to create.
  <permission_name>: The name of the permission to create.
  [guard_name]: Optional. The name of the guard to use for the role/permission.
  [permissions]: Optional. A pipe-separated string of permission names to create and assign to the role.
  --team-id=<team_id>: Optional. The ID of the team to associate the role with.
```

---

TITLE: Complex Wildcard Syntax with Subparts
DESCRIPTION: Explains and demonstrates the use of subparts separated by commas (,) for creating complex permission schemes. This allows for multiple actions or targets within a single permission string.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/wildcard-permissions.md

LANGUAGE: php
CODE:

```
// User can create, update, view on posts and users
Permission::create(['name'=>'posts,users.create,update,view']);
$user->givePermissionTo('posts,users.create,update,view');

// User can create, update, view on any resource
Permission::create(['name'=>'*.create,update,view']);
$user->givePermissionTo('*.create,update,view');

// User can do any action on posts with specific IDs
Permission::create(['name'=>'posts.*.1,4,6']);
$user->givePermissionTo('posts.*.1,4,6');
```

---

TITLE: Retrieve User Permissions and Roles
DESCRIPTION: Provides methods to fetch permissions and roles associated with a user. This includes direct permissions, permissions via roles, and role names.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
// Get permission names directly assigned to the user
$permissionNames = $user->getPermissionNames(); // Collection of name strings

// Get permission objects directly assigned to the user
$permissions = $user->permissions; // Collection of permission objects

// Get all permissions, directly or via roles
$allPermissions = $user->getAllPermissions();

// Get user's role names
$roles = $user->getRoleNames(); // Returns a collection
```

---

TITLE: Assigning Direct Permissions to Users (PHP)
DESCRIPTION: Details how to assign permissions directly to a user, independent of their roles. This allows for fine-grained control over user capabilities.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
$user->givePermissionTo('delete articles');
```

---

TITLE: Register Spatie Middleware Aliases (Laravel 11)
DESCRIPTION: Shows the method for registering middleware aliases ('role', 'permission', 'role_or_permission') in Laravel 11 by modifying the `bootstrap/app.php` file.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
// In Laravel 11 open /bootstrap/app.php and register them there:
// ...
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
```

---

TITLE: Checking Role Permissions (PHP)
DESCRIPTION: Shows how to verify if a specific role has been granted a particular permission. This is useful for authorization checks within the application logic.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
$role->hasPermissionTo('edit articles');
```

---

TITLE: Create Role/Permission for Specific Guard
DESCRIPTION: Shows how to create roles and permissions, explicitly assigning them to a guard using the `guard_name` attribute. This is crucial for managing permissions across different authentication guards.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/multiple-guards.md

LANGUAGE: PHP
CODE:

```
// Create a manager role for users authenticating with the admin guard:
$role = Role::create(['guard_name' => 'admin', 'name' => 'manager']);

// Define a `publish articles` permission for the admin users belonging to the admin guard
$permission = Permission::create(['guard_name' => 'admin', 'name' => 'publish articles']);

// Define a *different* `publish articles` permission for the regular users belonging to the web guard
$permission = Permission::create(['guard_name' => 'web', 'name' => 'publish articles']);
```

---

TITLE: Sync Permissions and Roles
DESCRIPTION: Enables syncing multiple permissions to a role or multiple roles to a permission. This is useful for bulk updates to a role's or permission's associated entities.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
$role->syncPermissions($permissions);
$permission->syncRoles($roles);
```

---

TITLE: Managing Role Permissions Collection (PHP)
DESCRIPTION: Illustrates how to access and manipulate the collection of permissions associated with a role. This includes retrieving all permission objects, their names, or counting them.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/role-permissions.md

LANGUAGE: php
CODE:

```
// get collection
$role->permissions;

// return only the permission names:
$role->permissions->pluck('name');

// count the number of permissions assigned to a role
count($role->permissions);
// or
$role->permissions->count();
```

---

TITLE: Generate Custom Role and Permission Models
DESCRIPTION: Use Artisan commands to create new Role and Permission model files. These files will serve as the base for your custom implementations, allowing for extensions like UUID support.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/advanced-usage/uuid.md

LANGUAGE: bash
CODE:

```
php artisan make:model Role
php artisan make:model Permission
```

---

TITLE: Middleware Namespace Change (v5 to v6)
DESCRIPTION: The namespace for middleware classes has been updated for consistency. The `SpatiePermissionMiddlewares` namespace (plural) has been renamed to `SpatiePermissionMiddleware` (singular).

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/upgrading.md

LANGUAGE: apidoc
CODE:

```
Middleware Namespace Update:

Old Namespace: `\Spatie\Permission\Middlewares\`
New Namespace: `\Spatie\Permission\Middleware\`

Update references in `app/Http/Kernel.php` and route files accordingly.
```

---

TITLE: Use Package Middleware in Controllers (Laravel 11)
DESCRIPTION: Shows how to register middleware directly within controllers in Laravel 11 by implementing the `HasMiddleware` interface and using the `middleware()` method.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
public static function middleware(): array
{
    return [
        // examples with aliases, pipe-separated names, guards, etc:
        'role_or_permission:manager|edit articles',
        new Middleware('role:author', only: ['index']),
        new Middleware(\Spatie\Permission\Middleware\RoleMiddleware::using('manager'), except:['show']),
        new Middleware(\Spatie\Permission\Middleware\PermissionMiddleware::using('delete records,api'), only:['destroy']),
    ];
}
```

---

TITLE: Register Spatie Middleware Aliases (Laravel 9-10)
DESCRIPTION: Illustrates how to register middleware aliases ('role', 'permission', 'role_or_permission') in Laravel 9 and 10 by adding them to the `$middlewareAliases` property in `app/Http/Kernel.php`.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/middleware.md

LANGUAGE: php
CODE:

```
// In Laravel 9 and 10 you can add them in app/Http/Kernel.php:
// ...
// Laravel 10+ uses $middlewareAliases = [
protected $middlewareAliases = [
    // ...
    'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
    'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
    'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
];
```

---

TITLE: Check User Permission for Specific Guard
DESCRIPTION: Illustrates how to verify if a user possesses a specific permission, specifying the guard to check against. This is essential for authorization logic in multi-guard applications.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/multiple-guards.md

LANGUAGE: PHP
CODE:

```
$user->hasPermissionTo('publish articles', 'admin');
```

---

TITLE: Assign and Revoke Permissions for Roles
DESCRIPTION: Shows methods for assigning a single permission to a role and revoking it. The package provides convenient methods for managing these relationships.

SOURCE: https://github.com/spatie/laravel-permission/blob/main/docs/basic-usage/basic-usage.md

LANGUAGE: php
CODE:

```
$role->givePermissionTo($permission);
$permission->assignRole($role);

$role->revokePermissionTo($permission);
$permission->removeRole($role);
```
