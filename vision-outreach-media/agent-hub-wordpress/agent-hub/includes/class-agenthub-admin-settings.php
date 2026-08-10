<?php

if (!defined('ABSPATH')) {
    exit;
}

class AgentHub_Admin_Settings
{
    private static ?AgentHub_Admin_Settings $instance = null;
    private AgentHub_Api_Client $client;

    public static function instance(): AgentHub_Admin_Settings
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->client = new AgentHub_Api_Client();
    }

    public function register_hooks(): void
    {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_agenthub_connect', [$this, 'handle_connect']);
        add_action('admin_post_agenthub_register', [$this, 'handle_register']);
        add_action('admin_post_agenthub_disconnect', [$this, 'handle_disconnect']);
        add_action('admin_post_agenthub_create_client', [$this, 'handle_create_client']);
        add_action('admin_post_agenthub_select_client', [$this, 'handle_select_client']);
    }

    public function register_settings(): void
    {
        register_setting('agenthub_settings', 'agenthub_api_base_url', [
            'sanitize_callback' => 'esc_url_raw',
            'default' => '',
        ]);
    }

    public function handle_connect(): void
    {
        $this->verify_request('agenthub_connect');

        $email = sanitize_email($_POST['agenthub_email'] ?? '');
        $password = (string) ($_POST['agenthub_password'] ?? '');

        if ($email === '' || $password === '') {
            $this->redirect_with_notice('error', __('Email and password are required to connect.', 'agent-hub'));
        }

        $result = $this->client->login($email, $password);

        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        $this->redirect_with_notice('success', __('Connected to Agent Hub.', 'agent-hub'));
    }

    public function handle_register(): void
    {
        $this->verify_request('agenthub_register');

        $email = sanitize_email($_POST['agenthub_new_email'] ?? '');
        $password = (string) ($_POST['agenthub_new_password'] ?? '');

        if ($email === '' || strlen($password) < 8) {
            $this->redirect_with_notice('error', __('A valid email and a password of at least 8 characters are required.', 'agent-hub'));
        }

        $result = $this->client->register($email, $password);

        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        $this->redirect_with_notice('success', __('Account created and connected.', 'agent-hub'));
    }

    public function handle_disconnect(): void
    {
        $this->verify_request('agenthub_disconnect');
        $this->client->disconnect();
        $this->redirect_with_notice('success', __('Disconnected from Agent Hub.', 'agent-hub'));
    }

    public function handle_create_client(): void
    {
        $this->verify_request('agenthub_create_client');

        $name = sanitize_text_field($_POST['agenthub_client_name'] ?? '');
        if ($name === '') {
            $this->redirect_with_notice('error', __('A name for this business/client is required.', 'agent-hub'));
        }

        $result = $this->client->create_client([
            'name' => $name,
            'niche' => sanitize_key($_POST['agenthub_client_niche'] ?? 'youtube_channel'),
            'profile' => [
                'topic' => sanitize_text_field($_POST['agenthub_profile_topic'] ?? ''),
                'audience' => sanitize_text_field($_POST['agenthub_profile_audience'] ?? ''),
                'tone' => sanitize_text_field($_POST['agenthub_profile_tone'] ?? ''),
                'posting_cadence' => sanitize_text_field($_POST['agenthub_profile_cadence'] ?? ''),
            ],
        ]);

        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        if (!empty($result['id'])) {
            $this->client->set_client_id((int) $result['id']);
        }

        $this->redirect_with_notice('success', __('Client created and selected.', 'agent-hub'));
    }

    public function handle_select_client(): void
    {
        $this->verify_request('agenthub_select_client');

        $client_id = (int) ($_POST['agenthub_client_id'] ?? 0);
        if ($client_id <= 0) {
            $this->redirect_with_notice('error', __('Choose a valid client.', 'agent-hub'));
        }

        $this->client->set_client_id($client_id);
        $this->redirect_with_notice('success', __('Client selected.', 'agent-hub'));
    }

    public function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $connected = $this->client->is_connected();
        $expiry = $this->client->token_expiry();
        $clients = [];
        $clients_error = null;

        if ($connected) {
            $result = $this->client->get_clients();
            if (is_wp_error($result)) {
                $clients_error = $result->get_error_message();
            } else {
                $clients = $result;
            }
        }

        $selected_client_id = $this->client->get_client_id();
        ?>
        <div class="wrap agenthub-wrap">
            <h1><?php esc_html_e('Agent Hub Settings', 'agent-hub'); ?></h1>
            <?php $this->render_notice(); ?>

            <h2><?php esc_html_e('1. API connection', 'agent-hub'); ?></h2>
            <form method="post" action="options.php">
                <?php settings_fields('agenthub_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="agenthub_api_base_url"><?php esc_html_e('Agent Cloud API URL', 'agent-hub'); ?></label></th>
                        <td>
                            <input type="url" id="agenthub_api_base_url" name="agenthub_api_base_url"
                                   value="<?php echo esc_attr($this->client->get_base_url()); ?>"
                                   class="regular-text" placeholder="https://api.yourdomain.com" required>
                            <p class="description"><?php esc_html_e('Base URL of your deployed Agent Cloud API, no trailing slash.', 'agent-hub'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(__('Save API settings', 'agent-hub')); ?>
            </form>

            <hr>

            <h2><?php esc_html_e('2. Connect your account', 'agent-hub'); ?></h2>
            <?php if ($connected): ?>
                <p>
                    <strong><?php esc_html_e('Status:', 'agent-hub'); ?></strong>
                    <?php esc_html_e('Connected.', 'agent-hub'); ?>
                    <?php if ($expiry): ?>
                        <?php
                        printf(
                            /* translators: %s: human-readable date/time */
                            esc_html__('Session expires %s.', 'agent-hub'),
                            esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $expiry))
                        );
                        ?>
                    <?php endif; ?>
                </p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="agenthub_disconnect">
                    <?php wp_nonce_field('agenthub_disconnect'); ?>
                    <?php submit_button(__('Disconnect', 'agent-hub'), 'secondary'); ?>
                </form>
            <?php else: ?>
                <p><?php esc_html_e('Already registered on the API (e.g. via curl while testing)? Connect below.', 'agent-hub'); ?></p>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="agenthub_connect">
                    <?php wp_nonce_field('agenthub_connect'); ?>
                    <table class="form-table">
                        <tr>
                            <th><label for="agenthub_email"><?php esc_html_e('Email', 'agent-hub'); ?></label></th>
                            <td><input type="email" id="agenthub_email" name="agenthub_email" class="regular-text" required></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_password"><?php esc_html_e('Password', 'agent-hub'); ?></label></th>
                            <td><input type="password" id="agenthub_password" name="agenthub_password" class="regular-text" required></td>
                        </tr>
                    </table>
                    <p class="description"><?php esc_html_e('Your password is used once to connect and is not stored — only the resulting session token is saved.', 'agent-hub'); ?></p>
                    <?php submit_button(__('Connect', 'agent-hub')); ?>
                </form>

                <h3><?php esc_html_e('New here? Create an account', 'agent-hub'); ?></h3>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="agenthub_register">
                    <?php wp_nonce_field('agenthub_register'); ?>
                    <table class="form-table">
                        <tr>
                            <th><label for="agenthub_new_email"><?php esc_html_e('Email', 'agent-hub'); ?></label></th>
                            <td><input type="email" id="agenthub_new_email" name="agenthub_new_email" class="regular-text" required></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_new_password"><?php esc_html_e('Password', 'agent-hub'); ?></label></th>
                            <td><input type="password" id="agenthub_new_password" name="agenthub_new_password" class="regular-text" minlength="8" required></td>
                        </tr>
                    </table>
                    <?php submit_button(__('Create account & connect', 'agent-hub')); ?>
                </form>
            <?php endif; ?>

            <?php if ($connected): ?>
                <hr>
                <h2><?php esc_html_e('3. Business / client', 'agent-hub'); ?></h2>
                <p class="description"><?php esc_html_e('Each "client" is one business the agent runs check-in cycles for — start with yourself before selling this to anyone else.', 'agent-hub'); ?></p>
                <?php if ($clients_error): ?>
                    <div class="notice notice-error"><p><?php echo esc_html($clients_error); ?></p></div>
                <?php endif; ?>

                <?php if (!empty($clients)): ?>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                        <input type="hidden" name="action" value="agenthub_select_client">
                        <?php wp_nonce_field('agenthub_select_client'); ?>
                        <table class="form-table">
                            <tr>
                                <th><label for="agenthub_client_id"><?php esc_html_e('Active client', 'agent-hub'); ?></label></th>
                                <td>
                                    <select id="agenthub_client_id" name="agenthub_client_id">
                                        <?php foreach ($clients as $c): ?>
                                            <option value="<?php echo esc_attr($c['id']); ?>" <?php selected($selected_client_id, $c['id']); ?>>
                                                <?php echo esc_html($c['name'] . ' (' . $c['niche'] . ')'); ?>
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                            </tr>
                        </table>
                        <?php submit_button(__('Use this client', 'agent-hub')); ?>
                    </form>
                <?php else: ?>
                    <p><?php esc_html_e('No client yet — create one below.', 'agent-hub'); ?></p>
                <?php endif; ?>

                <h3><?php esc_html_e('Add a business', 'agent-hub'); ?></h3>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="agenthub_create_client">
                    <?php wp_nonce_field('agenthub_create_client'); ?>
                    <table class="form-table">
                        <tr>
                            <th><label for="agenthub_client_name"><?php esc_html_e('Name', 'agent-hub'); ?></label></th>
                            <td><input type="text" id="agenthub_client_name" name="agenthub_client_name" class="regular-text" placeholder="e.g. Kurt - main channel" required></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_client_niche"><?php esc_html_e('Niche', 'agent-hub'); ?></label></th>
                            <td>
                                <select id="agenthub_client_niche" name="agenthub_client_niche">
                                    <option value="youtube_channel"><?php esc_html_e('YouTube channel growth', 'agent-hub'); ?></option>
                                </select>
                                <p class="description"><?php esc_html_e('More niches are added on the API side as they get built.', 'agent-hub'); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_profile_topic"><?php esc_html_e('Topic', 'agent-hub'); ?></label></th>
                            <td><input type="text" id="agenthub_profile_topic" name="agenthub_profile_topic" class="regular-text" placeholder="e.g. music theory + life coaching for musicians"></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_profile_audience"><?php esc_html_e('Audience', 'agent-hub'); ?></label></th>
                            <td><input type="text" id="agenthub_profile_audience" name="agenthub_profile_audience" class="regular-text" placeholder="e.g. self-taught musicians, church media volunteers"></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_profile_tone"><?php esc_html_e('Tone', 'agent-hub'); ?></label></th>
                            <td><input type="text" id="agenthub_profile_tone" name="agenthub_profile_tone" class="regular-text" placeholder="e.g. warm, practical, encouraging, no fluff"></td>
                        </tr>
                        <tr>
                            <th><label for="agenthub_profile_cadence"><?php esc_html_e('Posting cadence', 'agent-hub'); ?></label></th>
                            <td><input type="text" id="agenthub_profile_cadence" name="agenthub_profile_cadence" class="regular-text" placeholder="e.g. 1 video per week"></td>
                        </tr>
                    </table>
                    <?php submit_button(__('Create client', 'agent-hub')); ?>
                </form>
                <p class="description"><?php esc_html_e('More profile details (gear, channel status, etc.) can be added from the Tickets page once the agent asks for them.', 'agent-hub'); ?></p>
            <?php endif; ?>
        </div>
        <?php
    }

    private function verify_request(string $action): void
    {
        if (!current_user_can('manage_options') || !check_admin_referer($action)) {
            wp_die(esc_html__('Security check failed.', 'agent-hub'));
        }
    }

    private function redirect_with_notice(string $type, string $message): void
    {
        set_transient('agenthub_notice_' . get_current_user_id(), ['type' => $type, 'message' => $message], 60);
        wp_safe_redirect(add_query_arg(['page' => 'agenthub-settings'], admin_url('admin.php')));
        exit;
    }

    private function render_notice(): void
    {
        $key = 'agenthub_notice_' . get_current_user_id();
        $notice = get_transient($key);
        if (!$notice) {
            return;
        }
        delete_transient($key);
        $class = $notice['type'] === 'error' ? 'notice-error' : 'notice-success';
        printf('<div class="notice %s is-dismissible"><p>%s</p></div>', esc_attr($class), esc_html($notice['message']));
    }
}
