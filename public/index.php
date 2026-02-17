<?php
// Get visitor info
$ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN';
$time = date("Y-m-d H:i:s");

// Log format
$log = "[$time] IP: $ip | UA: $userAgent\n";

// Save to file
file_put_contents("ip_logs.txt", $log, FILE_APPEND | LOCK_EX);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>No Entry</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">

    <style>
        body {
            margin: 0;
            height: 100vh;
            background: #0f0f0f;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            color: #fff;
        }
        .box {
            text-align: center;
            padding: 40px;
            border: 2px solid #ff3b3b;
            border-radius: 12px;
            background: rgba(255,0,0,0.05);
            max-width: 420px;
            box-shadow: 0 0 30px rgba(255,0,0,0.3);
        }
        h1 {
            color: #ff3b3b;
            font-size: 32px;
        }
        p {
            opacity: 0.85;
        }
    </style>
</head>
<body>

<div class="box">
    <h1>🚫 No Entry</h1>
    <p>Nothing is here.</p>
    <p>This endpoint is not public.</p>
</div>

</body>
</html>
