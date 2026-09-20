<?php
// Boarding-pass enquiries: one email to the company, one designed
// confirmation to the traveller. Settings live in config.php beside this
// file (created by hand in hPanel, never deployed — see config.sample.php).
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function out(int $code, array $body): void { http_response_code($code); echo json_encode($body); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['ok' => false, 'error' => 'method']);

$cfgFile = __DIR__ . '/config.php';
if (!is_file($cfgFile)) out(503, ['ok' => false, 'error' => 'not_configured']);
$cfg = require $cfgFile;

$f = fn(string $k, int $max = 200): string => mb_substr(trim((string)($_POST[$k] ?? '')), 0, $max);
$name = $f('name', 120); $email = $f('email', 200); $interest = $f('interest', 160);
$message = $f('message', 4000); $lang = $f('lang', 2) === 'ar' ? 'ar' : 'en';
$page = $f('page', 300); $source = $f('source', 60) ?: 'Website';

// bots fill every field; people never see this one
if ($f('company_website') !== '') out(200, ['ok' => true]);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') out(422, ['ok' => false, 'error' => 'invalid']);
if (preg_match('/[\r\n]/', $name . $email)) out(422, ['ok' => false, 'error' => 'invalid']);

// five sends an hour per visitor
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$gate = sys_get_temp_dir() . '/trc-enq-' . sha1($ip . ($cfg['salt'] ?? 'trc'));
$hits = is_file($gate) ? array_filter(explode("\n", (string)file_get_contents($gate)), fn($t) => (int)$t > time() - 3600) : [];
if (count($hits) >= 5) out(429, ['ok' => false, 'error' => 'rate']);
$hits[] = (string)time(); @file_put_contents($gate, implode("\n", $hits));

$strings = json_decode((string)file_get_contents(__DIR__ . '/email/strings.json'), true)[$lang];
$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$site = rtrim((string)($cfg['site_url'] ?? ('https://' . ($_SERVER['HTTP_HOST'] ?? ''))), '/');
$flight = 'TRC · ' . str_pad((string)(crc32($email . microtime()) % 900 + 100), 3, '0', STR_PAD_LEFT);
$date = gmdate('d M Y');
$rtl = $lang === 'ar';

// the contact buttons come from the same Site settings the footer uses
$buttons = '';
$ctx = stream_context_create(['http' => ['timeout' => 3]]);
$q = rawurlencode('*[_id=="siteSettings"][0].contacts[show != false]{type, value}');
$raw = @file_get_contents("https://nvmppjc2.apicdn.sanity.io/v2026-08-01/data/query/production?query=$q", false, $ctx);
foreach ((json_decode((string)$raw, true)['result'] ?? []) as $c) {
  $v = trim((string)($c['value'] ?? '')); if ($v === '') continue;
  $digits = preg_replace('/\D/', '', $v);
  [$href, $label] = match ($c['type'] ?? '') {
    'whatsapp' => ["https://wa.me/$digits", $strings['whatsapp']],
    'phone' => ['tel:+' . $digits, $strings['call']],
    'email' => ["mailto:$v", $strings['write']],
    default => ['', ''],
  };
  if ($href) $buttons .= '<td style="padding:0 5px;"><a href="' . $e($href) . '" style="display:inline-block;border:1px solid #c8a24c;border-radius:999px;padding:10px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#e3c682;text-decoration:none;">' . $e($label) . '</a></td>';
}

// a barcode every client can draw: table cells, widths from a hash
$bars = ''; $h = sha1($email . $flight);
for ($i = 0; $i < 40; $i++) { $w = (hexdec($h[$i]) % 3) + 1; $bars .= '<td width="' . $w . '" style="width:' . $w . 'px;background:#16243c;font-size:0;">&nbsp;</td><td width="' . ((hexdec($h[39 - $i]) % 2) + 2) . '" style="font-size:0;">&nbsp;</td>'; }

$vars = [
  'lang' => $lang, 'dir' => $rtl ? 'rtl' : 'ltr', 'start' => $rtl ? 'right' : 'left', 'end' => $rtl ? 'left' : 'right',
  'plane_flip' => $rtl ? 'transform:scaleX(-1);' : '', 'site_url' => $e($site), 'year' => gmdate('Y'),
  'name' => $e($name), 'email' => $e($email), 'message' => $e($message),
  'route' => $e($interest !== '' && $interest !== 'To be arranged' ? mb_strtoupper($interest) : $strings['anywhere']),
  'flight' => $e($flight), 'date' => $e($date), 'barcode' => $bars, 'contact_buttons' => $buttons,
];
foreach ($strings as $k => $v) $vars["t_$k"] = $e(str_replace('{name}', $name, $v));

$fill = function (string $file, array $vars): string {
  $html = (string)file_get_contents(__DIR__ . '/email/' . $file);
  return preg_replace_callback('/\{\{(\w+)\}\}/', fn($m) => $vars[$m[1]] ?? '', $html);
};
$travellerHtml = $fill('traveller.html', $vars);
$companyHtml = $fill('company.html', $vars + ['source' => $e($source), 'language' => $rtl ? 'Arabic' : 'English', 'page' => $e($page)]);

require __DIR__ . '/mailer.php';
$from = (string)$cfg['from_email']; $fromName = (string)($cfg['from_name'] ?? 'The Retreat Collection');
$okCompany = trc_send($cfg, $from, $fromName, (string)$cfg['to_email'], "New enquiry — $name" . ($interest ? " · $interest" : ''), $companyHtml, $email, $name);
$okTraveller = trc_send($cfg, $from, $fromName, $email, $strings['subject'], $travellerHtml, (string)($cfg['reply_to'] ?? $cfg['to_email']), $fromName);
if (!$okCompany) out(502, ['ok' => false, 'error' => 'send']);
out(200, ['ok' => true, 'confirmation' => $okTraveller]);
