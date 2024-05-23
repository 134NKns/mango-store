<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, $role)
    {
        if (Auth::check()) {
            $user = Auth::user();
            $roles = explode('|', strtolower($role)); // Convert roles to lowercase
            if (!in_array(strtolower($user->role), $roles)) { // Convert user role to lowercase
                return response()->json(['error' => 'Forbidden', 'message' => 'Access denied'], 403);
            }
        } else {
            return response()->json(['error' => 'Unauthorized', 'message' => 'Please login first'], 401);
        }

        return $next($request);
    }
}


