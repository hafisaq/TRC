<?php
// Sends one HTML email. With smtp_host + smtp_user + smtp_pass in config it
// speaks SMTP over SSL to the mailbox (what inboxes trust); without them it
// falls back to PHP's mail(), which is enough for a first test.
declare(strict_types=1);

function trc_send(array $cfg, string $from, string $fromName, string $to, string $subject, string $html, string $replyTo = '', string $replyName = ''): bool {
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

  $sock = @stream_socket_client('ssl://' . $cfg['smtp_host'] . ':' . (int)($cfg['smtp_port'] ?? 465), $errno, $errstr, 12);
  if (!$sock) return false;
  stream_set_timeout($sock, 12);
  $read = function () use ($sock): string { $r = ''; while (($l = fgets($sock, 600)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
  $cmd = function (string $c, string $expect) use ($sock, $read): bool { fwrite($sock, $c . "\r\n"); return str_starts_with($read(), $expect); };
  $ok = str_starts_with($read(), '220')
    && $cmd('EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), '250')
    && $cmd('AUTH LOGIN', '334') && $cmd(base64_encode((string)$cfg['smtp_user']), '334') && $cmd(base64_encode((string)$cfg['smtp_pass']), '235')
    && $cmd("MAIL FROM:<$from>", '250') && $cmd("RCPT TO:<$to>", '250') && $cmd('DATA', '354');
  if ($ok) {
    $msg = implode("\r\n", array_merge($headers, ["To: <$to>", 'Subject: ' . $enc($subject), 'Date: ' . date('r'), 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>'])) . "\r\n\r\n" . $body;
    $ok = $cmd($msg . "\r\n.", '250');
  }
  $cmd('QUIT', '221');
  fclose($sock);
  return $ok;
}
