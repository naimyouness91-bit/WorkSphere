<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Cloud Messaging (HTTP v1)
    |--------------------------------------------------------------------------
    |
    | Path to your Firebase service account JSON file from the Firebase console.
    | Leave empty to disable push delivery (in-app notifications still work).
    |
    */
    'credentials' => env('FIREBASE_CREDENTIALS', ''),

    /*
    | Legacy server key (optional fallback for older FCM setups).
    */
    'server_key' => env('FCM_SERVER_KEY', ''),
];
