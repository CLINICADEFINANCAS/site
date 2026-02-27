<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

set_error_handler(function ($severity, $message, $file, $line) {
    if ($severity === E_DEPRECATED || $severity === E_USER_DEPRECATED) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Método não permitido"]);
    exit;
}

try {
    require_once __DIR__ . "/libs/fpdf.php";
    if (!class_exists("FPDF")) {
        throw new RuntimeException("FPDF não carregado.");
    }

$DEST_EMAIL = "consultoriasbilionaria@gmail.com";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "JSON inválido"]);
    exit;
}

/* =========================
   1. EXTRAÇÃO DE DADOS
========================= */
$lead = $data["lead"] ?? [];
$scores = $data["scores"] ?? [];
$answers = $data["answers"] ?? [];

$nome = trim(($lead["firstName"] ?? "") . " " . ($lead["lastName"] ?? ""));
$email = $lead["email"] ?? "—";
$telefone = $lead["phone"] ?? "—";

$overall = $scores["overall"] ?? "—";
$classificacao = $scores["classification"] ?? "—";

$dims = $scores["dims"] ?? [];

/* =========================
   2. GERA PDF EM MEMÓRIA
========================= */
    $toPdfEncoding = function (string $value): string {
        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $value);
            return $converted !== false ? $converted : $value;
        }
        if (function_exists('mb_convert_encoding')) {
            return mb_convert_encoding($value, 'ISO-8859-1', 'UTF-8');
        }
        return $value;
    };

    $pdf = new FPDF();
$pdf->AddPage();
$pdf->SetAutoPageBreak(true, 12);

/* Título */
$pdf->SetFont("Arial", "B", 16);
    $pdf->Cell(0, 10, $toPdfEncoding("Diagnóstico de Saúde Financeira"), 0, 1, "C");
$pdf->Ln(4);

/* Cliente */
$pdf->SetFont("Arial", "", 11);
    $pdf->Cell(0, 8, $toPdfEncoding("Cliente: $nome"), 0, 1);
    $pdf->Cell(0, 8, $toPdfEncoding("Telefone: $telefone"), 0, 1);
    $pdf->Cell(0, 8, $toPdfEncoding("E-mail: $email"), 0, 1);
$pdf->Ln(4);

/* Resultado */
$pdf->SetFont("Arial", "B", 12);
    $pdf->Cell(0, 8, $toPdfEncoding("Resultado Geral"), 0, 1);
$pdf->SetFont("Arial", "", 11);
    $pdf->Cell(0, 8, $toPdfEncoding("Pontuação: $overall"), 0, 1);
    $pdf->Cell(0, 8, $toPdfEncoding("Classificação: $classificacao"), 0, 1);
$pdf->Ln(3);

/* Dimensões */
$pdf->SetFont("Arial", "B", 12);
    $pdf->Cell(0, 8, $toPdfEncoding("Dimensões"), 0, 1);
$pdf->SetFont("Arial", "", 11);

foreach ($dims as $k => $v) {
    $label = ucfirst((string)$k);
    $pdf->Cell(0, 7, $toPdfEncoding("$label: $v / 100"), 0, 1);
}

$pdf->Ln(4);

/* Respostas */
$pdf->SetFont("Arial", "B", 12);
    $pdf->Cell(0, 8, $toPdfEncoding("Respostas do Questionário"), 0, 1);
$pdf->SetFont("Arial", "", 10);

foreach ($answers as $a) {
    $q = $a["question"] ?? "";
    $v = $a["label"] ?? ($a["value"] ?? "");
    $pdf->MultiCell(0, 6, $toPdfEncoding("• $q\n  Resposta: $v"));
    $pdf->Ln(1);
}

/* Captura PDF em string */
$pdfContent = $pdf->Output("S");

/* =========================
   3. ENVIO DE E-MAIL
========================= */
$boundary = md5((string)time());

$headers  = "From: Clinica de Finanças <no-reply@clinicadefinancas.com.br>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"";

$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
$body .= "Novo diagnóstico recebido.\n\n";
$body .= "Cliente: $nome\n";
$body .= "E-mail: $email\n";
$body .= "Telefone: $telefone\n\n";

$body .= "--$boundary\r\n";
$body .= "Content-Type: application/pdf; name=\"diagnostico.pdf\"\r\n";
$body .= "Content-Disposition: attachment; filename=\"diagnostico.pdf\"\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body .= chunk_split(base64_encode($pdfContent));
$body .= "--$boundary--";

    $sent = mail(
        $DEST_EMAIL,
        "Novo Diagnóstico de Saúde Financeira",
        $body,
        $headers
    );

    if (!$sent) {
        throw new RuntimeException("Falha ao enviar e-mail.");
    }

    echo json_encode(["ok" => true]);
} catch (Throwable $e) {
    error_log("send-diagnosis.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Erro interno", "details" => $e->getMessage()]);
}
