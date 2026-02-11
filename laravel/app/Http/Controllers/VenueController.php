<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Venue;
use App\Models\Availability;
use Carbon\Carbon;

class VenueController extends Controller
{
    /**
     * Search venues with filters (authenticated users)
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'cuisine' => 'nullable|string|max:100',
            'priceRange' => 'nullable|in:$,$$,$$$,$$$$',
            'limit' => 'nullable|integer|min:1|max:50'
        ]);

        $query = Venue::query()->where('active', true);

        // Apply filters
        if ($request->filled('query')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->query . '%')
                  ->orWhere('description', 'like', '%' . $request->query . '%')
                  ->orWhere('cuisine_type', 'like', '%' . $request->query . '%');
            });
        }

        if ($request->filled('location')) {
            $query->where(function($q) use ($request) {
                $q->where('address', 'like', '%' . $request->location . '%')
                  ->orWhere('city', 'like', '%' . $request->location . '%')
                  ->orWhere('neighborhood', 'like', '%' . $request->location . '%');
            });
        }

        if ($request->filled('cuisine')) {
            $query->where('cuisine_type', 'like', '%' . $request->cuisine . '%');
        }

        if ($request->filled('priceRange')) {
            $query->where('price_range', $request->priceRange);
        }

        $limit = $request->input('limit', 10);
        $venues = $query->with(['images', 'amenities'])
                       ->orderBy('rating', 'desc')
                       ->limit($limit)
                       ->get();

        return response()->json($venues);
    }

    /**
     * Public venue search (for guest users - limited data)
     */
    public function publicSearch(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'cuisine' => 'nullable|string|max:100',
            'limit' => 'nullable|integer|min:1|max:20'
        ]);

        $query = Venue::query()->where('active', true);

        // Apply basic filters (same as above but more limited)
        if ($request->filled('query')) {
            $query->where('name', 'like', '%' . $request->query . '%');
        }

        if ($request->filled('location')) {
            $query->where('city', 'like', '%' . $request->location . '%');
        }

        if ($request->filled('cuisine')) {
            $query->where('cuisine_type', 'like', '%' . $request->cuisine . '%');
        }

        $limit = min($request->input('limit', 10), 20); // Max 20 for public
        
        // Return limited data for public users
        $venues = $query->select([
                'id', 'name', 'cuisine_type', 'price_range', 
                'rating', 'city', 'neighborhood'
            ])
            ->orderBy('rating', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($venues);
    }

    /**
     * Show venue details
     */
    public function show(Venue $venue): JsonResponse
    {
        return response()->json($venue->load(['images', 'amenities', 'reviews' => function($query) {
            $query->latest()->limit(5);
        }]));
    }

    /**
     * Check availability for a venue
     */
    public function checkAvailability(Request $request, Venue $venue): JsonResponse
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:H:i',
            'party_size' => 'required|integer|min:1|max:20'
        ]);

        $requestedDateTime = Carbon::createFromFormat(
            'Y-m-d H:i',
            $request->date . ' ' . $request->time
        );

        // Check if the venue is open at this time
        $dayOfWeek = $requestedDateTime->format('l'); // Monday, Tuesday, etc.
        $time = $requestedDateTime->format('H:i');

        $openingHours = $venue->opening_hours[$dayOfWeek] ?? null;
        
        if (<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VenueController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes for PRIMA AI Agent Integration
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
            'service' => 'prima-ai-laravel-api'
        ]);
    });
});

// Public venue search (for guest users)
Route::get('/venues/search', [VenueController::class, 'publicSearch'])
    ->middleware('throttle:30,1');
EOFopeningHours || $time < $openingHours['open'] || $time > $openingHours['close']) {
            return response()->json([
                'available' => false,
                'reason' => 'Venue is closed at this time',
                'opening_hours' => $openingHours
            ]);
        }

        // Check table availability
        $availability = Availability::where('venue_id', $venue->id)
            ->where('date', $request->date)
            ->where('time', $request->time)
            ->where('available_capacity', '>=', $request->party_size)
            ->first();

        if ($availability) {
            return response()->json([
                'available' => true,
                'capacity' => $availability->available_capacity,
                'table_type' => $availability->table_type,
                'price_modifier' => $availability->price_modifier ?? 1.0
            ]);
        }

        return response()->json([
            'available' => false,
            'reason' => 'No tables available for the requested party size and time',
            'alternative_times' => $this->suggestAlternativeTimes($venue, $request->date, $request->party_size)
        ]);
    }

    /**
     * Suggest alternative times when requested slot is unavailable
     */
    private function suggestAlternativeTimes(Venue $venue, string $date, int $partySize): array
    {
        $alternatives = Availability::where('venue_id', $venue->id)
            ->where('date', $date)
            ->where('available_capacity', '>=', $partySize)
            ->orderBy('time')
            ->limit(3)
            ->pluck('time')
            ->toArray();

        return array_map(function($time) {
            return Carbon::createFromFormat('H:i:s', $time)->format('H:i');
        }, $alternatives);
    }
}
