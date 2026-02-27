<?php
// Proxy para Apps Script (evita CORS) - raiz
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido']);
  exit;
}

$raw = file_get_contents('php://input');
if (!$raw) {
  http_response_code(400);
  echo json_encode(['error' => 'Payload vazio']);
  exit;
}

$data = json_decode($raw, true);
if ($data === null) {
  http_response_code(400);
  echo json_encode(['error' => 'JSON inválido']);
  exit;
}

$appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzO_k5mDsJGRCwDa0WPsla4fZuyP-r7wgaimeItkCLBHmDIoi2XZiDm0wcLYDj_6OnOxQ/exec';
$token = 'cf_9F3kLx12_0pQ7zA8mN5rT6uV2wY040211Sa*';

if (!isset($data['token']) || !$data['token']) {
  $data['token'] = $token;
}

$payload = json_encode($data);

$response = null;
$httpCode = 0;
$error = null;

if (function_exists('curl_init')) {
  $ch = curl_init($appsScriptUrl);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
  ]);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);
} else {
  $opts = [
    'http' => [
      'method'  => 'POST',
      'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
      'content' => $payload,
      'ignore_errors' => true
    ]
  ];
  $context = stream_context_create($opts);
  $response = file_get_contents($appsScriptUrl, false, $context);
  if (isset($http_response_header[0]) && preg_match('#HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m)) {
    $httpCode = (int)$m[1];
  }
}

if ($response === false || $response === null) {
  http_response_code(502);
  echo json_encode(['error' => 'Falha no envio ao Apps Script', 'details' => $error]);
  exit;
}

http_response_code($httpCode ?: 200);

echo $response;
