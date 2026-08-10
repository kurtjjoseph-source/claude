<?php
/**
 * Plugin Name: Agent Hub
 * Description: Dashboard for autonomous business agents (Agent Cloud API) - review proposed tickets, approve/reject/redirect, and trigger check-in cycles from WordPress.
 * Version: 0.1.0
 * Author: Vision Outreach Media
 * Text Domain: agent-hub
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AGENTHUB_VERSION', '0.1.0');
define('AGENTHUB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AGENTHUB_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once AGENTHUB_PLUGIN_DIR . 'includes/class-agenthub-api-client.php';
require_once AGENTHUB_PLUGIN_DIR . 'includes/class-agenthub-admin-settings.php';
require_once AGENTHUB_PLUGIN_DIR . 'includes/class-agenthub-admin-tickets.php';

final class AgentHub_Plugin
{
    private static ?AgentHub_Plugin $instance = null;

    public static function instance(): AgentHub_Plugin
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        AgentHub_Admin_Settings::instance()->register_hooks();
        AgentHub_Admin_Tickets::instance()->register_hooks();
    }

    public function register_admin_menu(): void
    {
        add_menu_page(
            __('Agent Hub', 'agent-hub'),
            __('Agent Hub', 'agent-hub'),
            'manage_options',
            'agenthub-tickets',
            [AgentHub_Admin_Tickets::instance(), 'render_page'],
            'dashicons-groups',
            59
        );

        add_submenu_page(
            'agenthub-tickets',
            __('Tickets', 'agent-hub'),
            __('Tickets', 'agent-hub'),
            'manage_options',
            'agenthub-tickets',
            [AgentHub_Admin_Tickets::instance(), 'render_page']
        );

        add_submenu_page(
            'agenthub-tickets',
            __('Agent Hub Settings', 'agent-hub'),
            __('Settings', 'agent-hub'),
            'manage_options',
            'agenthub-settings',
            [AgentHub_Admin_Settings::instance(), 'render_page']
        );
    }

    public function enqueue_admin_assets(string $hook): void
    {
        if (strpos($hook, 'agenthub-') === false) {
            return;
        }

        wp_enqueue_style(
            'agenthub-admin',
            AGENTHUB_PLUGIN_URL . 'assets/admin.css',
            [],
            AGENTHUB_VERSION
        );
    }
}

AgentHub_Plugin::instance();
