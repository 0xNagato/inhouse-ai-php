<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VenueController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes for InHouse AI Agent Integration
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    
    // Venue routes
    Route::prefix('venues')->group(function () {
        Route::get('/search', [VenueController::class, 'search']);
        Route::get('/{venue}', [VenueController::class, 'show']);
        Route::post('/{venue}/availability', [VenueController::class, 'checkAvailability']);
    });
    
    // Booking routes
    Route::prefix('bookings')->group(function () {
        Route::get('/', [BookingController::class, 'index']);
        Route::post('/', [BookingController::class, 'store']);
        Route::get('/{booking}', [BookingController::class, 'show']);
        Route::patch('/{booking}', [BookingController::class, 'update']);
        Route::delete('/{booking}', [BookingController::class, 'destroy']);
    });
    
    // Analytics routes (admin/manager only)
    Route::prefix('analytics')->middleware('role:admin,manager')->group(function () {
        Route::get('/bookings', [AnalyticsController::class, 'bookings']);
        Route::get('/revenue', [AnalyticsController::class, 'revenue']);
        Route::get('/occupancy', [AnalyticsController::class, 'occupancy']);
        Route::get('/popular_venues', [AnalyticsController::class, 'popularVenues']);
    });
    
    // User routes (admin only for user lookup)
    Route::prefix('users')->middleware('role:admin')->group(function () {
        Route::get('/', [UserController::class, 'search']);
        Route::get('/{user}', [UserController::class, 'show']);
    });
    
    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now(),
            'service' => 'inhouse-ai-laravel-api'
        ]);
    });
});

// Public venue search (for guest users)
Route::get('/venues/search', [VenueController::class, 'publicSearch'])
    ->middleware('throttle:30,1');
