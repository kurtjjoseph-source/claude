<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Thin wrapper around the Agent Cloud API using the WP HTTP API.
 *
 * Credential handling: only the JWT + its expiry are persisted (in wp_options).
 * The password entered on the settings page is used once to obtain a token and
 * is never stored. When the token expires (7 days by default on the API side),
 * the admin re-enters email/password to reconnect. Mirrors engage-ai's client.
 */
class AgentHub_Api_Client
{
    private const OPT_BASE_URL = 'agenthub_api_base_url';
    private const OPT_TOKEN = 'agenthub_jwt_token';
    private const OPT_TOKEN_EXP = 'agenthub_jwt_expires_at';
    private const OPT_CLIENT_ID = 'agenthub_client_id';

    public function get_base_url(): string
    {
        return rtrim((string) get_option(self::OPT_BASE_URL, ''), '/');
    }

    public function set_base_url(string $url): void
    {
        update_option(self::OPT_BASE_URL, rtrim(trim($url), '/'));
    }

    public function get_client_id()
    {
        $id = get_option(self::OPT_CLIENT_ID, '');
        return $id === '' ? null : (int) $id;
    }

    public function set_client_id(int $id): void
    {
        update_option(self::OPT_CLIENT_ID, $id);
    }

    public function is_connected(): bool
    {
        $token = get_option(self::OPT_TOKEN, '');
        $expires_at = (int) get_option(self::OPT_TOKEN_EXP, 0);
        return $token !== '' && $expires_at > time();
    }

    public function token_expiry(): ?int
    {
        $expires_at = (int) get_option(self::OPT_TOKEN_EXP, 0);
        return $expires_at > 0 ? $expires_at : null;
    }

    public function disconnect(): void
    {
        delete_option(self::OPT_TOKEN);
        delete_option(self::OPT_TOKEN_EXP);
    }

    /**
     * @return true|WP_Error
     */
    public function login(string $email, string $password)
    {
        $result = $this->request('POST', '/auth/login', [
            'email' => $email,
            'password' => $password,
        ], false);

        if (is_wp_error($result)) {
            return $result;
        }

        if (empty($result['access_token'])) {
            return new WP_Error('agenthub_login_failed', __('Login succeeded but no token was returned.', 'agent-hub'));
        }

        $token = $result['access_token'];
        update_option(self::OPT_TOKEN, $token, false);
        update_option(self::OPT_TOKEN_EXP, $this->extract_jwt_expiry($token), false);

        return true;
    }

    /**
     * @return true|WP_Error
     */
    public function register(string $email, string $password)
    {
        $result = $this->request('POST', '/auth/register', [
            'email' => $email,
            'password' => $password,
        ], false);

        if (is_wp_error($result)) {
            return $result;
        }

        if (empty($result['access_token'])) {
            return new WP_Error('agenthub_register_failed', __('Registration succeeded but no token was returned.', 'agent-hub'));
        }

        $token = $result['access_token'];
        update_option(self::OPT_TOKEN, $token, false);
        update_option(self::OPT_TOKEN_EXP, $this->extract_jwt_expiry($token), false);

        return true;
    }

    /**
     * @return array|WP_Error
     */
    public function get_clients()
    {
        return $this->request('GET', '/clients');
    }

    /**
     * @return array|WP_Error
     */
    public function create_client(array $data)
    {
        return $this->request('POST', '/clients', $data);
    }

    /**
     * @return array|WP_Error
     */
    public function update_client_profile(int $client_id, array $profile)
    {
        return $this->request('PATCH', '/clients/' . $client_id . '/profile', $profile);
    }

    /**
     * @return array|WP_Error list of tickets
     */
    public function get_tickets(int $client_id, ?string $status = null)
    {
        $path = '/clients/' . $client_id . '/tickets';
        if ($status !== null) {
            $path .= '?status=' . rawurlencode($status);
        }
        return $this->request('GET', $path);
    }

    /**
     * @param string $decision one of: approve, reject, redirect
     * @return array|WP_Error
     */
    public function decide_ticket(int $client_id, int $ticket_id, string $decision, string $note = '')
    {
        return $this->request('POST', '/clients/' . $client_id . '/tickets/' . $ticket_id . '/decision', [
            'decision' => $decision,
            'note' => $note !== '' ? $note : null,
        ]);
    }

    /**
     * Runs one check-in cycle now - the same function the scheduler calls automatically.
     * @return array|WP_Error the AgentRun record
     */
    public function run_cycle(int $client_id)
    {
        return $this->request('POST', '/clients/' . $client_id . '/cycles/run');
    }

    /**
     * @return array|WP_Error list of past AgentRuns, most recent first
     */
    public function get_cycles(int $client_id)
    {
        return $this->request('GET', '/clients/' . $client_id . '/cycles');
    }

    /**
     * @return array|WP_Error decoded JSON body, or WP_Error on failure
     */
    private function request(string $method, string $path, ?array $body = null, bool $use_auth = true)
    {
        $base_url = $this->get_base_url();
        if ($base_url === '') {
            return new WP_Error('agenthub_not_configured', __('Agent Hub API URL is not configured yet.', 'agent-hub'));
        }

        $headers = ['Content-Type' => 'application/json'];

        if ($use_auth) {
            $token = get_option(self::OPT_TOKEN, '');
            if ($token === '') {
                return new WP_Error('agenthub_not_connected', __('Not connected to Agent Hub. Connect on the Settings page first.', 'agent-hub'));
            }
            $headers['Authorization'] = 'Bearer ' . $token;
        }

        $args = [
            'method' => $method,
            'headers' => $headers,
            'timeout' => 60,
        ];

        if ($body !== null) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($base_url . $path, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        $raw = wp_remote_retrieve_body($response);
        $decoded = json_decode($raw, true);

        if ($status >= 400) {
            $detail = is_array($decoded) && isset($decoded['detail']) ? $decoded['detail'] : $raw;
            return new WP_Error('agenthub_api_error', sprintf(
                /* translators: 1: HTTP status code, 2: error detail from the API */
                __('Agent Hub API error (%1$d): %2$s', 'agent-hub'),
                $status,
                is_string($detail) ? $detail : wp_json_encode($detail)
            ));
        }

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Reads the `exp` claim out of a JWT without verifying its signature - the
     * API itself is the source of truth on validity; this is only used to know
     * when to prompt the admin to reconnect.
     */
    private function extract_jwt_expiry(string $jwt): int
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return time() + DAY_IN_SECONDS;
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        if (is_array($payload) && !empty($payload['exp'])) {
            return (int) $payload['exp'];
        }

        return time() + DAY_IN_SECONDS;
    }
}
