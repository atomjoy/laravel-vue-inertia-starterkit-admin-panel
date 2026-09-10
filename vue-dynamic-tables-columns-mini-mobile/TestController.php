<?php

namespace App\Http\Controllers\Tests\Tables;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

// Test users
// Route::get('table', [TestController::class, 'index']);
class TestController extends Controller
{
    protected $protectedRoles = ['admin', 'superadmin'];
    protected $sortingColumns = ['id', 'name', 'created_at', 'email_verified_at', 'two_factor_confirmed_at'];
    protected $filterUrlParams = ['filter_verified', 'filter_2fa',  'date_to', 'date_from', 'page', 'per_page', 'roles', 'search', 'sort_by', 'sort_dir'];

    public function index(Request $request)
    {
        // Filterable trait scope
        // $users = User::searchFilters($filters)->paginate(15);

        $perPage = $request->input('per_page') <= 100 ? $request->input('per_page', 10) : 100;
        $sortBy = $request->input('sort_by', 'id');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (!in_array($sortBy, $this->sortingColumns)) {
            $sortBy = 'id';
        }

        $usersQuery = User::query()->with('roles')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->input('filter_verified'), function ($query, $verified) {
                if ($verified === 'verified') {
                    $query->whereNotNull('email_verified_at');
                } elseif ($verified === 'unverified') {
                    $query->whereNull('email_verified_at');
                }
            })
            ->when($request->input('filter_2fa'), function ($query, $twoFactor) {
                if ($twoFactor === 'enabled') {
                    $query->whereNotNull('two_factor_confirmed_at');
                } elseif ($twoFactor === 'disabled') {
                    $query->whereNull('two_factor_confirmed_at');
                }
            })
            ->when($request->input('date_from'), function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($request->input('date_to'), function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            })
            ->when($request->input('roles'), function ($query, $roles) {
                $query->role($roles); // Spatie
            });

        $usersQuery->reorder();

        if (in_array($sortBy, ['email_verified_at', 'two_factor_confirmed_at'])) {
            $usersQuery->orderByRaw("{$sortBy} IS NULL ASC")->orderBy($sortBy, $sortDir);
        } else {
            $usersQuery->orderBy($sortBy, $sortDir);
        }

        return Inertia::render('tests/tables/Index', [
            'payload' => $usersQuery->paginate($perPage)->withQueryString(),
            'roles' => $this->roleFacetsWithSearch($request),
            'filters' => $request->only($this->filterUrlParams),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user->hasRole($this->protectedRoles)) {
            return back()->with('error', __('The administrator account cannot be deleted.'));
        }

        $user->delete();

        return back()->with('success', __('The user has been deleted.'));
    }

    // End-point dla masowego usuwania
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id'
        ]);

        $ids = $request->input('ids');
        $usersToDelete = User::whereIn('id', $ids)->get();

        foreach ($usersToDelete as $user) {
            if ($user->hasRole($this->protectedRoles)) {
                return back()->with('error', __('Operation aborted. Selected users have protected roles:') . " " . implode('|', $this->protectedRoles));
            } else {
                $user->delete();
            }
        }

        return back()->with('success', __('Selected users successfully deleted.'));
    }

    public function roleFacetsWithSearch(Request $request, $guard = 'web')
    {
        $search = $request->input('search');

        return Role::query()
            ->withCount(['users' => function ($query) use ($search) {
                $query->when(!empty($search), function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('users.name', 'like', "%{$search}%")
                            ->orWhere('users.email', 'like', "%{$search}%");
                    });
                });
            }])
            ->where('roles.guard_name', $guard)
            ->get(['id', 'name'])->map(fn($role) => [
                'value' => $role->name,
                'label' => ucfirst($role->name),
                'count' => $role->users_count,
            ]);
    }
}
