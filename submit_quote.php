<?php
// --- 1. DATABASE CONNECTION ---
$servername = "localhost"; // Usually "localhost"
$username = "root"; // Default username for XAMPP
$password = ""; // Default password for XAMPP is empty
$dbname = "ardent_estimator"; // The database name you created

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // If connection fails, send back a server error
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}


// --- 2. RECEIVE AND DECODE FRONTEND DATA ---
// Get the JSON data sent from the JavaScript
$json_data = file_get_contents('php://input');
// Decode the JSON data into a PHP object
$data = json_decode($json_data);

// Check if data is valid
if (!$data || !isset($data->clientInfo)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid data received.']);
    exit();
}


// --- 3. PREPARE DATA FOR DATABASE ---
$name = $data->clientInfo->name;
$email = $data->clientInfo->email;
$phone = $data->clientInfo->phone;

$website_type = $data->websiteType->value ?? 'N/A';
$page_count = $data->pageCount->value ?? 'N/A';
$total_cost = $data->totalCost;

// Combine all selections into a single JSON string to store in one column
$selections = [
    'additionalServices' => $data->additionalServices,
    'additionalFeatures' => $data->additionalFeatures
];
$selections_json = json_encode($selections);


// --- 4. INSERT DATA USING A PREPARED STATEMENT (for security) ---
// The SQL query with placeholders (?)
$sql = "INSERT INTO submissions (client_name, client_email, client_phone, website_type, page_count, total_cost, selections_json) VALUES (?, ?, ?, ?, ?, ?, ?)";

// Prepare the statement
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
    exit();
}

// Bind the actual variables to the placeholders
// "sssssis" means: s=string, s=string, s=string, s=string, s=string, i=integer, s=string
$stmt->bind_param("sssssis", $name, $email, $phone, $website_type, $page_count, $total_cost, $selections_json);


// --- 5. EXECUTE AND SEND RESPONSE ---
if ($stmt->execute()) {
    // If execution is successful, send back a success response
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Quote submitted successfully!']);
} else {
    // If execution fails, send back an error response
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to submit quote: ' . $stmt->error]);
}

// Close the statement and connection
$stmt->close();
$conn->close();

?>