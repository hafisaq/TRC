<?php
// Copy this file to config.php (same folder) in hPanel's File Manager and
// fill it in there. config.php is never in the repository and the deploy
// never touches it. Opening it in a browser shows nothing.
return [
  'to_email'   => 'hello@example.com',        // where the company copy goes
  'from_email' => 'enquiries@example.com',    // a real mailbox on your domain
  'from_name'  => 'The Retreat Collection',
  'reply_to'   => 'hello@example.com',        // where a traveller's reply lands
  'site_url'   => 'https://www.example.com',  // used for the logo in the email

  // Hostinger mailbox SMTP — leave these three empty to use PHP mail() for a first test
  'smtp_host'  => 'smtp.hostinger.com',
  'smtp_port'  => 465,
  'smtp_user'  => '',
  'smtp_pass'  => '',

  'salt'       => 'change-me',
];
