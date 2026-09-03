<?php
/**
 * Приёмник статистики. Пишет по одному событию в строку в stats/stats-ГГГГ-ММ.jsonl.
 * Намеренно не сохраняет IP, User-Agent и не ставит куки — чтобы не возникало
 * обработки персональных данных и связанных с ней обязанностей по 152-ФЗ.
 */

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$raw = file_get_contents('php://input', false, null, 0, 2048);
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    exit;
}

// принимаем только известные события — чтобы в файл не сыпался мусор
$allowed = ['page_view', 'click', 'faq', 'calc'];
$event = isset($data['event']) ? (string)$data['event'] : '';
if (!in_array($event, $allowed, true)) {
    http_response_code(400);
    exit;
}

$clean = static function ($v) {
    if (is_int($v) || is_float($v) || is_bool($v)) return $v;
    $s = (string)$v;
    // без модификатора /u битая последовательность не обрушит preg_replace
    $s = preg_replace('/[\x00-\x1F\x7F]/', '', $s);
    if ($s === null) return '';
    // mbstring на хостинге обычно есть, но полагаться на него не стоит
    return function_exists('mb_substr') ? mb_substr($s, 0, 200, 'UTF-8') : substr($s, 0, 200);
};

date_default_timezone_set('Europe/Moscow');
$row = ['time' => date('Y-m-d H:i:s'), 'event' => $event];
foreach ($data as $k => $v) {
    if ($k === 'event' || !is_scalar($v)) continue;
    $key = preg_replace('/[^a-z_]/', '', (string)$k);
    if ($key !== '' && $key !== 'time') $row[$key] = $clean($v);
}

$dir = __DIR__ . '/stats';
if (!is_dir($dir)) @mkdir($dir, 0750, true);
$file = $dir . '/stats-' . date('Y-m') . '.jsonl';

// страховка от бесконтрольного роста
if (is_file($file) && filesize($file) > 20 * 1024 * 1024) {
    http_response_code(507);
    exit;
}

$line = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
$fh = @fopen($file, 'ab');
if ($fh) {
    if (flock($fh, LOCK_EX)) {   // без блокировки строки от разных посетителей перемешаются
        fwrite($fh, $line);
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
}

http_response_code(204);
