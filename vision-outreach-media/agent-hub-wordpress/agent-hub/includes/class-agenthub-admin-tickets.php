<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * The actual dashboard Kurt asked for: review what the agent proposed, and
 * approve / reject / redirect from inside WordPress instead of curl.
 */
class AgentHub_Admin_Tickets
{
    private static ?AgentHub_Admin_Tickets $instance = null;
    private AgentHub_Api_Client $client;

    public static function instance(): AgentHub_Admin_Tickets
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
        add_action('admin_post_agenthub_run_cycle', [$this, 'handle_run_cycle']);
        add_action('admin_post_agenthub_decide_ticket', [$this, 'handle_decide_ticket']);
        add_action('admin_post_agenthub_update_profile', [$this, 'handle_update_profile']);
    }

    public function handle_run_cycle(): void
    {
        $this->verify_request('agenthub_run_cycle');

        $client_id = $this->client->get_client_id();
        if (!$client_id) {
            $this->redirect_with_notice('error', __('Select a client on the Settings page first.', 'agent-hub'));
        }

        $result = $this->client->run_cycle($client_id);
        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        $count = (int) ($result['tickets_created'] ?? 0);
        $this->redirect_with_notice('success', sprintf(
            /* translators: %d: number of new tickets created */
            _n('Cycle complete: %d new ticket proposed.', 'Cycle complete: %d new tickets proposed.', $count, 'agent-hub'),
            $count
        ));
    }

    public function handle_decide_ticket(): void
    {
        $this->verify_request('agenthub_decide_ticket');

        $client_id = $this->client->get_client_id();
        $ticket_id = (int) ($_POST['agenthub_ticket_id'] ?? 0);
        $decision = sanitize_key($_POST['agenthub_decision'] ?? '');
        $note = sanitize_textarea_field($_POST['agenthub_note'] ?? '');

        if (!$client_id || $ticket_id <= 0 || !in_array($decision, ['approve', 'reject', 'redirect'], true)) {
            $this->redirect_with_notice('error', __('Invalid ticket decision.', 'agent-hub'));
        }

        $result = $this->client->decide_ticket($client_id, $ticket_id, $decision, $note);
        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        $this->redirect_with_notice('success', __('Ticket updated.', 'agent-hub'));
    }

    public function handle_update_profile(): void
    {
        $this->verify_request('agenthub_update_profile');

        $client_id = $this->client->get_client_id();
        $key = sanitize_key($_POST['agenthub_profile_key'] ?? '');
        $value = sanitize_text_field($_POST['agenthub_profile_value'] ?? '');

        if (!$client_id || $key === '') {
            $this->redirect_with_notice('error', __('A field name is required.', 'agent-hub'));
        }

        $result = $this->client->update_client_profile($client_id, [$key => $value]);
        if (is_wp_error($result)) {
            $this->redirect_with_notice('error', $result->get_error_message());
        }

        $this->redirect_with_notice('success', __('Profile updated - the next cycle will use this.', 'agent-hub'));
    }

    public function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (!$this->client->is_connected()) {
            $this->render_not_ready(__('Connect your Agent Hub account on the Settings page first.', 'agent-hub'));
            return;
        }

        $client_id = $this->client->get_client_id();
        if (!$client_id) {
            $this->render_not_ready(__('Select or create a client on the Settings page first.', 'agent-hub'));
            return;
        }

        $tickets = $this->client->get_tickets($client_id);
        $tickets_error = is_wp_error($tickets) ? $tickets->get_error_message() : null;
        $tickets = is_wp_error($tickets) ? [] : $tickets;

        $cycles = $this->client->get_cycles($client_id);
        $cycles = is_wp_error($cycles) ? [] : $cycles;

        $groups = ['proposed' => [], 'approved' => [], 'backlog' => [], 'rejected' => []];
        foreach ($tickets as $t) {
            $status = $t['status'] ?? 'proposed';
            $groups[$status][] = $t;
        }
        ?>
        <div class="wrap agenthub-wrap">
            <h1><?php esc_html_e('Agent Hub - Tickets', 'agent-hub'); ?></h1>
            <?php $this->render_notice(); ?>

            <?php if ($tickets_error): ?>
                <div class="notice notice-error"><p><?php echo esc_html($tickets_error); ?></p></div>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 1em 0;">
                <input type="hidden" name="action" value="agenthub_run_cycle">
                <?php wp_nonce_field('agenthub_run_cycle'); ?>
                <?php submit_button(__('Run check-in cycle now', 'agent-hub'), 'primary', 'submit', false); ?>
                <p class="description"><?php esc_html_e('This is the same cycle the scheduler runs automatically - use it to test on demand.', 'agent-hub'); ?></p>
            </form>

            <h2>
                <?php
                printf(
                    /* translators: %d: number of tickets awaiting a decision */
                    esc_html__('Awaiting your decision (%d)', 'agent-hub'),
                    count($groups['proposed'])
                );
                ?>
            </h2>
            <?php if (empty($groups['proposed'])): ?>
                <p><?php esc_html_e('Nothing waiting on you right now.', 'agent-hub'); ?></p>
            <?php else: ?>
                <div class="agenthub-tickets">
                    <?php foreach ($groups['proposed'] as $t): ?>
                        <?php $this->render_ticket_card($t, true); ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <h2><?php esc_html_e('Update the agent\'s memory', 'agent-hub'); ?></h2>
            <p class="description"><?php esc_html_e('If a ticket above is a clarifying question, answer it here as a field/value pair so the next cycle has the context.', 'agent-hub'); ?></p>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="agenthub-profile-form">
                <input type="hidden" name="action" value="agenthub_update_profile">
                <?php wp_nonce_field('agenthub_update_profile'); ?>
                <input type="text" name="agenthub_profile_key" placeholder="<?php esc_attr_e('field name, e.g. gear', 'agent-hub'); ?>" required>
                <input type="text" name="agenthub_profile_value" placeholder="<?php esc_attr_e('value, e.g. webcam + piano/drums/guitar on hand', 'agent-hub'); ?>" required style="width: 40%;">
                <?php submit_button(__('Save to profile', 'agent-hub'), 'secondary', 'submit', false); ?>
            </form>

            <?php if (!empty($groups['approved'])): ?>
                <h2>
                    <?php
                    printf(
                        /* translators: %d: number of approved tickets */
                        esc_html__('Approved / in progress (%d)', 'agent-hub'),
                        count($groups['approved'])
                    );
                    ?>
                </h2>
                <div class="agenthub-tickets">
                    <?php foreach ($groups['approved'] as $t): ?>
                        <?php $this->render_ticket_card($t, false); ?>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($cycles)): ?>
                <h2><?php esc_html_e('Recent check-in cycles', 'agent-hub'); ?></h2>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('When', 'agent-hub'); ?></th>
                            <th><?php esc_html_e('Summary', 'agent-hub'); ?></th>
                            <th><?php esc_html_e('New tickets', 'agent-hub'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($cycles, 0, 10) as $run): ?>
                            <tr>
                                <td><?php echo esc_html($run['ran_at'] ?? ''); ?></td>
                                <td><?php echo esc_html($run['summary'] ?? ''); ?></td>
                                <td><?php echo esc_html((string) ($run['tickets_created'] ?? 0)); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    private function render_ticket_card(array $t, bool $show_decision_buttons): void
    {
        $risk = $t['risk'] ?? 'low';
        $payload = $t['payload'] ?? [];
        ?>
        <div class="agenthub-card">
            <h3>
                <?php echo esc_html($t['title'] ?? ''); ?>
                <span class="agenthub-risk agenthub-risk-<?php echo esc_attr($risk); ?>">
                    <?php echo esc_html(strtoupper($risk)); ?>
                </span>
            </h3>
            <?php if (!empty($t['rationale'])): ?>
                <p class="agenthub-rationale"><em><?php echo esc_html($t['rationale']); ?></em></p>
            <?php endif; ?>

            <?php $this->render_payload($payload); ?>

            <?php if ($show_decision_buttons): ?>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="agenthub-decision-form">
                    <input type="hidden" name="action" value="agenthub_decide_ticket">
                    <input type="hidden" name="agenthub_ticket_id" value="<?php echo esc_attr($t['id']); ?>">
                    <?php wp_nonce_field('agenthub_decide_ticket'); ?>
                    <textarea name="agenthub_note" rows="2" placeholder="<?php esc_attr_e('optional note - e.g. an answer to a question, or feedback for redirect', 'agent-hub'); ?>"></textarea>
                    <p>
                        <button type="submit" name="agenthub_decision" value="approve" class="button button-primary"><?php esc_html_e('Approve', 'agent-hub'); ?></button>
                        <button type="submit" name="agenthub_decision" value="redirect" class="button"><?php esc_html_e('Redirect', 'agent-hub'); ?></button>
                        <button type="submit" name="agenthub_decision" value="reject" class="button button-link-delete"><?php esc_html_e('Reject', 'agent-hub'); ?></button>
                    </p>
                </form>
            <?php elseif (!empty($t['decision_note'])): ?>
                <p class="agenthub-decision-note"><strong><?php esc_html_e('Note:', 'agent-hub'); ?></strong> <?php echo esc_html($t['decision_note']); ?></p>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Payloads are niche-specific JSON. Render the youtube_channel shape
     * (working_title/hook/outline/thumbnail_concepts/why_this_now) and the
     * generic clarifying-question shape nicely; fall back to a raw list for
     * any future niche's fields so this page doesn't need to change per niche.
     */
    private function render_payload(array $payload): void
    {
        if (!empty($payload['question'])) {
            echo '<p class="agenthub-question"><strong>' . esc_html__('Question:', 'agent-hub') . '</strong> ' . esc_html($payload['question']) . '</p>';
            return;
        }

        if (!empty($payload['working_title'])) {
            echo '<p><strong>' . esc_html__('Working title:', 'agent-hub') . '</strong> ' . esc_html($payload['working_title']) . '</p>';
        }
        if (!empty($payload['hook'])) {
            echo '<p><strong>' . esc_html__('Hook:', 'agent-hub') . '</strong> ' . esc_html($payload['hook']) . '</p>';
        }
        if (!empty($payload['outline']) && is_array($payload['outline'])) {
            echo '<p><strong>' . esc_html__('Outline:', 'agent-hub') . '</strong></p><ul>';
            foreach ($payload['outline'] as $line) {
                echo '<li>' . esc_html($line) . '</li>';
            }
            echo '</ul>';
        }
        if (!empty($payload['thumbnail_concepts']) && is_array($payload['thumbnail_concepts'])) {
            echo '<p><strong>' . esc_html__('Thumbnail ideas:', 'agent-hub') . '</strong></p><ul>';
            foreach ($payload['thumbnail_concepts'] as $idea) {
                echo '<li>' . esc_html($idea) . '</li>';
            }
            echo '</ul>';
        }
        if (!empty($payload['why_this_now'])) {
            echo '<p class="agenthub-why"><em>' . esc_html($payload['why_this_now']) . '</em></p>';
        }

        $known = ['question', 'working_title', 'hook', 'outline', 'thumbnail_concepts', 'why_this_now'];
        $rest = array_diff_key($payload, array_flip($known));
        if (!empty($rest)) {
            echo '<details><summary>' . esc_html__('Other details', 'agent-hub') . '</summary><pre>' . esc_html(wp_json_encode($rest, JSON_PRETTY_PRINT)) . '</pre></details>';
        }
    }

    private function render_not_ready(string $message): void
    {
        ?>
        <div class="wrap agenthub-wrap">
            <h1><?php esc_html_e('Agent Hub', 'agent-hub'); ?></h1>
            <div class="notice notice-warning"><p><?php echo esc_html($message); ?></p></div>
            <p>
                <a href="<?php echo esc_url(admin_url('admin.php?page=agenthub-settings')); ?>" class="button button-primary">
                    <?php esc_html_e('Go to Settings', 'agent-hub'); ?>
                </a>
            </p>
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
        wp_safe_redirect(add_query_arg(['page' => 'agenthub-tickets'], admin_url('admin.php')));
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
