<?php
// Sends one HTML email. With smtp_host + smtp_user + smtp_pass in config it
// speaks SMTP over SSL to the mailbox (what inboxes trust); without them it
// falls back to PHP's mail(), which is enough for a first test.
declare(strict_types=1);

// When a send fails, the step that failed and the mail server's own reply
// are left here (never the password) so enquiry.php can note them down.
$GLOBALS['trc_smtp_error'] = '';

function trc_send(array $cfg, string $from, string $fromName, string $to, string $subject, string $html, string $replyTo = '', string $replyName = ''): bool {
  $GLOBALS['trc_smtp_error'] = '';
  $enc = fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';
  $headers = [
    'From: ' . $enc($fromName) . " <$from>",
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  if ($replyTo !== '') $headers[] = 'Reply-To: ' . ($replyName !== '' ? $enc($replyName) . " <$replyTo>" : $replyTo);
  $body = chunk_split(base64_encode($html));

  if (empty($cfg['smtp_host']) || empty($cfg['smtp_user']) || empty($cfg['smtp_pass'])) {
    return @mail($to, $enc($subject), $body, implode("\r\n", $headers), '-f' . $from);
  }

  // Port 465 speaks TLS from the first byte (Hostinger, Gmail). Port 587
  // starts in the clear and upgrades with STARTTLS (Microsoft 365, most
  // business mail) — the mailbox the client's domain already runs on.
  $port = (int)($cfg['smtp_port'] ?? 465);
  $starttls = $port === 587 || (($cfg['smtp_secure'] ?? '') === 'tls');
  $sock = @stream_socket_client(($starttls ? 'tcp://' : 'ssl://') . $cfg['smtp_host'] . ':' . $port, $errno, $errstr, 12);
  if (!$sock) { $GLOBALS['trc_smtp_error'] = "connect: $errno $errstr"; return false; }
  stream_set_timeout($sock, 12);
  $last = ''; $step = '';
  $read = function () use ($sock, &$last): string { $r = ''; while (($l = fgets($sock, 600)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $last = $r; };
  $cmd = function (string $c, string $expect) use ($sock, $read): bool { fwrite($sock, $c . "\r\n"); return str_starts_with($read(), $expect); };
  // remembers the first step that went wrong
  $try = function (string $name, bool $ok) use (&$step): bool { if (!$ok && $step === '') $step = $name; return $ok; };
  $me = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $ok = $try('greeting', str_starts_with($read(), '220')) && $try('ehlo', $cmd("EHLO $me", '250'));
  if ($ok && $starttls) {
    $ok = $try('starttls', $cmd('STARTTLS', '220'))
      && $try('tls', stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) === true)
      && $try('ehlo-tls', $cmd("EHLO $me", '250'));
  }
  $ok = $ok
    && $try('auth', $cmd('AUTH LOGIN', '334')) && $try('auth-user', $cmd(base64_encode((string)$cfg['smtp_user']), '334'))
    && $try('auth-password', $cmd(base64_encode((string)$cfg['smtp_pass']), '235'))
    && $try('mail-from', $cmd("MAIL FROM:<$from>", '250')) && $try('rcpt-to', $cmd("RCPT TO:<$to>", '250')) && $try('data', $cmd('DATA', '354'));
  if ($ok) {
    $msg = implode("\r\n", array_merge($headers, ["To: <$to>", 'Subject: ' . $enc($subject), 'Date: ' . date('r'), 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>'])) . "\r\n\r\n" . $body;
    $ok = $try('message', $cmd($msg . "\r\n.", '250'));
  }
  if (!$ok) $GLOBALS['trc_smtp_error'] = $step . ': ' . mb_substr(trim((string)preg_replace('/\s+/', ' ', $last)), 0, 400);
  $cmd('QUIT', '221');
  fclose($sock);
  return $ok;
}
