<?php

return [
    'ml_service_url' => env('ANALYTICS_ML_SERVICE_URL'),
    'ml_service_timeout' => (int) env('ANALYTICS_ML_TIMEOUT', 10),
    'prediction_accuracy' => (float) env('ANALYTICS_PREDICTION_ACCURACY', 0.82),
];
