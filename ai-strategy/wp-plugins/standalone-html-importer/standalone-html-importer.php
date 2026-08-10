<?php
/**
 * Plugin Name: Standalone HTML Importer
 * Description: Import standalone HTML files (AI-generated pages, reports, landing pages) as pages on your WordPress site. Serve them pixel-perfect as-is with an optional site navigation bar, or embed them inside your theme.
 * Version: 1.1.1
 * Author: Kurt Joseph — Vision Outreach Media
 * License: GPL-2.0-or-later
 * Text Domain: standalone-html-importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Standalone_HTML_Importer {

	const CPT       = 'shi_html_page';
	const META_HTML = '_shi_html';
	const META_MODE = '_shi_mode';   // 'standalone' | 'themed'
	const META_NAV  = '_shi_navbar'; // '1' | ''

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_cpt' ) );
		add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
		add_action( 'admin_post_shi_import', array( __CLASS__, 'handle_import' ) );
		add_action( 'add_meta_boxes', array( __CLASS__, 'meta_boxes' ) );
		add_action( 'save_post_' . self::CPT, array( __CLASS__, 'save_meta' ), 10, 2 );
		add_action( 'template_redirect', array( __CLASS__, 'render_standalone' ) );
		add_filter( 'the_content', array( __CLASS__, 'render_themed' ), 20 );
		add_filter( 'manage_' . self::CPT . '_posts_columns', array( __CLASS__, 'list_columns' ) );
		add_action( 'manage_' . self::CPT . '_posts_custom_column', array( __CLASS__, 'list_column_content' ), 10, 2 );
		add_action( 'admin_notices', array( __CLASS__, 'admin_notices' ) );

		register_activation_hook( __FILE__, array( __CLASS__, 'activate' ) );
		register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
	}

	public static function activate() {
		self::register_cpt();
		flush_rewrite_rules();
	}

	/* ------------------------------------------------------------------ */
	/* Post type                                                           */
	/* ------------------------------------------------------------------ */

	public static function register_cpt() {
		register_post_type(
			self::CPT,
			array(
				'labels'              => array(
					'name'          => __( 'HTML Pages', 'standalone-html-importer' ),
					'singular_name' => __( 'HTML Page', 'standalone-html-importer' ),
					'add_new_item'  => __( 'Add HTML Page', 'standalone-html-importer' ),
					'edit_item'     => __( 'Edit HTML Page', 'standalone-html-importer' ),
					'not_found'     => __( 'No HTML pages imported yet.', 'standalone-html-importer' ),
				),
				'public'              => true,
				'show_ui'             => true,
				'show_in_menu'        => true,
				'menu_icon'           => 'dashicons-media-code',
				'menu_position'       => 21,
				'supports'            => array( 'title' ),
				'has_archive'         => false,
				'show_in_nav_menus'   => true,
				'exclude_from_search' => false,
				'show_in_rest'        => false,
				'rewrite'             => array(
					'slug'       => apply_filters( 'shi_rewrite_slug', 'html' ),
					'with_front' => false,
				),
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Admin: import screen                                                */
	/* ------------------------------------------------------------------ */

	public static function admin_menu() {
		add_submenu_page(
			'edit.php?post_type=' . self::CPT,
			__( 'Import HTML', 'standalone-html-importer' ),
			__( 'Import HTML', 'standalone-html-importer' ),
			'manage_options',
			'shi-import',
			array( __CLASS__, 'render_import_page' )
		);
	}

	public static function render_import_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Import a standalone HTML file', 'standalone-html-importer' ); ?></h1>
			<p><?php esc_html_e( 'Upload an .html file (or paste HTML) and it becomes a page on this site with its own URL. Self-contained files with inline CSS/JS work best.', 'standalone-html-importer' ); ?></p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
				<?php wp_nonce_field( 'shi_import', 'shi_nonce' ); ?>
				<input type="hidden" name="action" value="shi_import" />
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="shi_files"><?php esc_html_e( 'HTML file(s)', 'standalone-html-importer' ); ?></label></th>
						<td>
							<input type="file" name="shi_files[]" id="shi_files" accept=".html,.htm" multiple />
							<p class="description"><?php esc_html_e( 'Select one or more .html files — each becomes its own page. Title comes from the file\'s <title> tag, the URL slug from the filename. Or paste HTML below instead.', 'standalone-html-importer' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="shi_html"><?php esc_html_e( 'Paste HTML', 'standalone-html-importer' ); ?></label></th>
						<td><textarea name="shi_html" id="shi_html" rows="10" class="large-text code" placeholder="&lt;!DOCTYPE html&gt;…"></textarea></td>
					</tr>
					<tr>
						<th scope="row"><label for="shi_title"><?php esc_html_e( 'Page title', 'standalone-html-importer' ); ?></label></th>
						<td>
							<input type="text" name="shi_title" id="shi_title" class="regular-text" />
							<p class="description"><?php esc_html_e( 'Optional override for single-file or pasted imports. Ignored when importing multiple files.', 'standalone-html-importer' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="shi_slug"><?php esc_html_e( 'URL slug', 'standalone-html-importer' ); ?></label></th>
						<td>
							<input type="text" name="shi_slug" id="shi_slug" class="regular-text" placeholder="my-page" />
							<p class="description"><?php esc_html_e( 'Optional override for single-file or pasted imports; pages live at /html/&lt;slug&gt;/. Ignored when importing multiple files.', 'standalone-html-importer' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Display mode', 'standalone-html-importer' ); ?></th>
						<td>
							<label><input type="radio" name="shi_mode" value="standalone" checked /> <?php esc_html_e( 'Standalone — serve the file exactly as-is (pixel-perfect)', 'standalone-html-importer' ); ?></label><br />
							<label><input type="radio" name="shi_mode" value="themed" /> <?php esc_html_e( 'Themed — embed the page body inside your theme header/footer', 'standalone-html-importer' ); ?></label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Site navigation bar', 'standalone-html-importer' ); ?></th>
						<td>
							<label><input type="checkbox" name="shi_navbar" value="1" checked /> <?php esc_html_e( 'Add a slim bar at the top with your site name and menu, so visitors can get back to the rest of the site (standalone mode only).', 'standalone-html-importer' ); ?></label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'If the slug already exists', 'standalone-html-importer' ); ?></th>
						<td>
							<label><input type="checkbox" name="shi_replace" value="1" /> <?php esc_html_e( 'Replace the existing HTML page (keeps the same URL).', 'standalone-html-importer' ); ?></label>
						</td>
					</tr>
				</table>
				<?php submit_button( __( 'Import HTML page', 'standalone-html-importer' ) ); ?>
			</form>
		</div>
		<?php
	}

	public static function handle_import() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to import HTML pages.', 'standalone-html-importer' ) );
		}
		check_admin_referer( 'shi_import', 'shi_nonce' );

		// Collect one or more documents to import: uploaded files first, pasted HTML as fallback.
		$docs = array(); // Each: array( 'html' => ..., 'title' => ..., 'slug' => ... ).

		if ( ! empty( $_FILES['shi_files']['tmp_name'] ) && is_array( $_FILES['shi_files']['tmp_name'] ) ) {
			$count = count( $_FILES['shi_files']['tmp_name'] );
			for ( $i = 0; $i < $count; $i++ ) {
				$tmp = $_FILES['shi_files']['tmp_name'][ $i ];
				if ( empty( $tmp ) || ! is_uploaded_file( $tmp ) ) {
					continue;
				}
				$name = sanitize_file_name( wp_unslash( $_FILES['shi_files']['name'][ $i ] ) );
				$ext  = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
				if ( ! in_array( $ext, array( 'html', 'htm' ), true ) ) {
					self::redirect_with_message( 'bad_ext' );
				}
				$docs[] = array(
					'html'  => (string) file_get_contents( $tmp ), // phpcs:ignore
					'title' => '',
					'slug'  => sanitize_title( pathinfo( $name, PATHINFO_FILENAME ) ),
				);
			}
		}

		if ( empty( $docs ) && ! empty( $_POST['shi_html'] ) ) {
			$docs[] = array(
				'html'  => wp_unslash( $_POST['shi_html'] ), // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- raw HTML, gated below.
				'title' => '',
				'slug'  => '',
			);
		}

		if ( empty( $docs ) ) {
			self::redirect_with_message( 'empty' );
		}

		// Manual title/slug overrides only make sense for a single document.
		if ( 1 === count( $docs ) ) {
			$manual_title = isset( $_POST['shi_title'] ) ? sanitize_text_field( wp_unslash( $_POST['shi_title'] ) ) : '';
			$manual_slug  = isset( $_POST['shi_slug'] ) ? sanitize_title( wp_unslash( $_POST['shi_slug'] ) ) : '';
			if ( '' !== $manual_title ) {
				$docs[0]['title'] = $manual_title;
			}
			if ( '' !== $manual_slug ) {
				$docs[0]['slug'] = $manual_slug;
			}
		}

		$mode    = ( isset( $_POST['shi_mode'] ) && 'themed' === $_POST['shi_mode'] ) ? 'themed' : 'standalone';
		$navbar  = empty( $_POST['shi_navbar'] ) ? '' : '1';
		$replace = ! empty( $_POST['shi_replace'] );

		$imported     = 0;
		$last_post_id = 0;
		foreach ( $docs as $doc ) {
			$post_id = self::import_document( $doc, $mode, $navbar, $replace );
			if ( $post_id ) {
				$imported++;
				$last_post_id = $post_id;
			}
		}

		if ( 0 === $imported ) {
			self::redirect_with_message( 'error' );
		}

		self::redirect_with_message( 'ok', 1 === $imported ? $last_post_id : 0, $imported );
	}

	/**
	 * Import a single HTML document. Returns the post ID or 0 on failure.
	 */
	private static function import_document( $doc, $mode, $navbar, $replace ) {
		$html = (string) $doc['html'];
		if ( '' === trim( $html ) ) {
			return 0;
		}
		$html = self::sanitize_html_for_user( $html );

		$title = $doc['title'];
		if ( '' === $title && preg_match( '/<title[^>]*>(.*?)<\/title>/is', $html, $m ) ) {
			$title = sanitize_text_field( wp_strip_all_tags( $m[1] ) );
		}
		if ( '' === $title && '' !== $doc['slug'] ) {
			$title = ucwords( str_replace( '-', ' ', $doc['slug'] ) );
		}
		if ( '' === $title ) {
			$title = __( 'Imported HTML page', 'standalone-html-importer' );
		}

		$slug = $doc['slug'];

		$post_id  = 0;
		$existing = $slug ? get_page_by_path( $slug, OBJECT, self::CPT ) : null;
		// wp_insert_post/wp_update_post expect slashed data — without wp_slash(),
		// WordPress strips every backslash from the content.
		if ( $existing && $replace ) {
			$post_id = $existing->ID;
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $post_id,
						'post_title'   => $title,
						'post_content' => self::plain_text_excerpt( $html ),
					)
				)
			);
		} else {
			$post_id = wp_insert_post(
				wp_slash(
					array(
						'post_type'    => self::CPT,
						'post_status'  => 'publish',
						'post_title'   => $title,
						'post_name'    => $slug,
						'post_content' => self::plain_text_excerpt( $html ),
					)
				),
				true
			);
			if ( is_wp_error( $post_id ) ) {
				return 0;
			}
		}

		// update_post_meta also expects slashed values; raw HTML with \n, \\ or
		// escaped quotes in inline <script> gets corrupted without wp_slash().
		update_post_meta( $post_id, self::META_HTML, wp_slash( $html ) );
		update_post_meta( $post_id, self::META_MODE, $mode );
		update_post_meta( $post_id, self::META_NAV, $navbar );

		return $post_id;
	}

	private static function redirect_with_message( $msg, $post_id = 0, $count = 0 ) {
		$url = add_query_arg(
			array(
				'post_type' => self::CPT,
				'page'      => 'shi-import',
				'shi_msg'   => $msg,
				'shi_post'  => $post_id,
				'shi_count' => $count,
			),
			admin_url( 'edit.php' )
		);
		wp_safe_redirect( $url );
		exit;
	}

	public static function admin_notices() {
		if ( empty( $_GET['shi_msg'] ) || empty( $_GET['page'] ) || 'shi-import' !== $_GET['page'] ) { // phpcs:ignore
			return;
		}
		$msg     = sanitize_key( wp_unslash( $_GET['shi_msg'] ) ); // phpcs:ignore
		$post_id = isset( $_GET['shi_post'] ) ? absint( $_GET['shi_post'] ) : 0; // phpcs:ignore

		if ( 'ok' === $msg ) {
			if ( $post_id ) {
				printf(
					'<div class="notice notice-success is-dismissible"><p>%s <a href="%s" target="_blank">%s</a> · <a href="%s">%s</a></p></div>',
					esc_html__( 'HTML page imported.', 'standalone-html-importer' ),
					esc_url( get_permalink( $post_id ) ),
					esc_html__( 'View page', 'standalone-html-importer' ),
					esc_url( get_edit_post_link( $post_id ) ),
					esc_html__( 'Edit', 'standalone-html-importer' )
				);
			} else {
				$count = isset( $_GET['shi_count'] ) ? absint( $_GET['shi_count'] ) : 0; // phpcs:ignore
				printf(
					'<div class="notice notice-success is-dismissible"><p>%s <a href="%s">%s</a></p></div>',
					esc_html( sprintf(
						/* translators: %d: number of imported pages. */
						_n( '%d HTML page imported.', '%d HTML pages imported.', $count, 'standalone-html-importer' ),
						$count
					) ),
					esc_url( admin_url( 'edit.php?post_type=' . self::CPT ) ),
					esc_html__( 'View all HTML pages', 'standalone-html-importer' )
				);
			}
			return;
		}

		$errors = array(
			'empty'   => __( 'No HTML received — upload a file or paste HTML.', 'standalone-html-importer' ),
			'bad_ext' => __( 'Only .html or .htm files can be imported.', 'standalone-html-importer' ),
			'error'   => __( 'Could not create the page. Please try again.', 'standalone-html-importer' ),
		);
		if ( isset( $errors[ $msg ] ) ) {
			printf( '<div class="notice notice-error is-dismissible"><p>%s</p></div>', esc_html( $errors[ $msg ] ) );
		}
	}

	/* ------------------------------------------------------------------ */
	/* Admin: edit screen meta boxes                                       */
	/* ------------------------------------------------------------------ */

	public static function meta_boxes() {
		add_meta_box( 'shi_html_box', __( 'HTML source', 'standalone-html-importer' ), array( __CLASS__, 'render_html_box' ), self::CPT, 'normal', 'high' );
		add_meta_box( 'shi_settings_box', __( 'Display settings', 'standalone-html-importer' ), array( __CLASS__, 'render_settings_box' ), self::CPT, 'side' );
	}

	public static function render_html_box( $post ) {
		wp_nonce_field( 'shi_save_meta', 'shi_meta_nonce' );
		$html = get_post_meta( $post->ID, self::META_HTML, true );
		printf(
			'<textarea name="shi_html" rows="24" class="large-text code" style="font-family:Menlo,Consolas,monospace;">%s</textarea>',
			esc_textarea( $html )
		);
	}

	public static function render_settings_box( $post ) {
		$mode   = get_post_meta( $post->ID, self::META_MODE, true );
		$mode   = $mode ? $mode : 'standalone';
		$navbar = get_post_meta( $post->ID, self::META_NAV, true );
		?>
		<p><strong><?php esc_html_e( 'Display mode', 'standalone-html-importer' ); ?></strong></p>
		<p>
			<label><input type="radio" name="shi_mode" value="standalone" <?php checked( $mode, 'standalone' ); ?> /> <?php esc_html_e( 'Standalone (as-is)', 'standalone-html-importer' ); ?></label><br />
			<label><input type="radio" name="shi_mode" value="themed" <?php checked( $mode, 'themed' ); ?> /> <?php esc_html_e( 'Inside theme', 'standalone-html-importer' ); ?></label>
		</p>
		<p>
			<label><input type="checkbox" name="shi_navbar" value="1" <?php checked( $navbar, '1' ); ?> /> <?php esc_html_e( 'Add site navigation bar', 'standalone-html-importer' ); ?></label>
		</p>
		<?php
	}

	public static function save_meta( $post_id, $post ) {
		if ( ! isset( $_POST['shi_meta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['shi_meta_nonce'] ), 'shi_save_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['shi_html'] ) ) {
			$html = self::sanitize_html_for_user( wp_unslash( $_POST['shi_html'] ) ); // phpcs:ignore
			// Meta and post functions expect slashed data; without wp_slash()
			// every backslash in the HTML/JS is stripped on save.
			update_post_meta( $post_id, self::META_HTML, wp_slash( $html ) );

			// Keep post_content in sync so WP search / excerpts see real text.
			remove_action( 'save_post_' . self::CPT, array( __CLASS__, 'save_meta' ), 10 );
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $post_id,
						'post_content' => self::plain_text_excerpt( $html ),
					)
				)
			);
			add_action( 'save_post_' . self::CPT, array( __CLASS__, 'save_meta' ), 10, 2 );
		}

		$mode = ( isset( $_POST['shi_mode'] ) && 'themed' === $_POST['shi_mode'] ) ? 'themed' : 'standalone';
		update_post_meta( $post_id, self::META_MODE, $mode );
		update_post_meta( $post_id, self::META_NAV, empty( $_POST['shi_navbar'] ) ? '' : '1' );
	}

	/* ------------------------------------------------------------------ */
	/* Front end: standalone rendering                                     */
	/* ------------------------------------------------------------------ */

	public static function render_standalone() {
		if ( ! is_singular( self::CPT ) ) {
			return;
		}
		$post = get_queried_object();
		$mode = get_post_meta( $post->ID, self::META_MODE, true );
		if ( 'themed' === $mode ) {
			return; // Handled by the_content filter inside the theme.
		}

		$html = (string) get_post_meta( $post->ID, self::META_HTML, true );
		if ( '' === $html ) {
			return;
		}

		if ( '1' === get_post_meta( $post->ID, self::META_NAV, true ) ) {
			$html = self::inject_navbar( $html );
		}

		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput -- intentionally raw, admin-gated HTML document.
		exit;
	}

	private static function inject_navbar( $html ) {
		$bar = self::navbar_html();
		if ( preg_match( '/<body[^>]*>/i', $html ) ) {
			return preg_replace( '/<body[^>]*>/i', '$0' . $bar, $html, 1 );
		}
		return $bar . $html;
	}

	private static function navbar_html() {
		$links   = array();
		$links[] = array( home_url( '/' ), get_bloginfo( 'name' ), true );

		$menu_id = 0;
		foreach ( (array) get_nav_menu_locations() as $id ) {
			if ( $id ) {
				$menu_id = (int) $id;
				break;
			}
		}
		if ( $menu_id ) {
			$items = wp_get_nav_menu_items( $menu_id );
			foreach ( (array) $items as $item ) {
				if ( 0 === (int) $item->menu_item_parent ) {
					$links[] = array( $item->url, $item->title, false );
				}
			}
		} else {
			foreach ( get_pages( array( 'sort_column' => 'menu_order,post_title', 'number' => 6 ) ) as $p ) {
				$links[] = array( get_permalink( $p ), get_the_title( $p ), false );
			}
		}

		$anchors = '';
		foreach ( array_slice( $links, 0, 8 ) as $l ) {
			$anchors .= sprintf(
				'<a href="%s" style="color:inherit;text-decoration:none;%s;white-space:nowrap;">%s</a>',
				esc_url( $l[0] ),
				$l[2] ? 'font-weight:700' : 'opacity:.85',
				esc_html( $l[1] )
			);
		}

		// A normal in-flow bar (not fixed) so it never overlaps the imported page's own layout.
		return '<div id="shi-site-nav" style="box-sizing:border-box;width:100%;display:flex;gap:1.25em;align-items:center;flex-wrap:wrap;padding:10px 20px;background:#111827;color:#f9fafb;font:14px/1.4 -apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' . $anchors . '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Front end: themed rendering                                         */
	/* ------------------------------------------------------------------ */

	public static function render_themed( $content ) {
		if ( ! is_singular( self::CPT ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		if ( 'themed' !== get_post_meta( get_the_ID(), self::META_MODE, true ) ) {
			return $content;
		}

		$html = (string) get_post_meta( get_the_ID(), self::META_HTML, true );
		$out  = '';

		// Carry over <style>, stylesheet <link>, and <script> tags from <head>.
		if ( preg_match( '/<head[^>]*>(.*?)<\/head>/is', $html, $head ) ) {
			if ( preg_match_all( '/<style[^>]*>.*?<\/style>|<link[^>]+rel=["\']?stylesheet["\']?[^>]*>|<script\b[^>]*>.*?<\/script>/is', $head[1], $m ) ) {
				$out .= implode( "\n", $m[0] ) . "\n";
			}
		}

		if ( preg_match( '/<body[^>]*>(.*)<\/body>/is', $html, $body ) ) {
			$out .= $body[1];
		} else {
			$out .= $html;
		}

		return '<div class="shi-embedded-html">' . $out . '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Admin: list table columns                                           */
	/* ------------------------------------------------------------------ */

	public static function list_columns( $columns ) {
		$columns['shi_mode'] = __( 'Mode', 'standalone-html-importer' );
		$columns['shi_url']  = __( 'URL', 'standalone-html-importer' );
		return $columns;
	}

	public static function list_column_content( $column, $post_id ) {
		if ( 'shi_mode' === $column ) {
			$mode = get_post_meta( $post_id, self::META_MODE, true );
			echo esc_html( 'themed' === $mode ? __( 'Inside theme', 'standalone-html-importer' ) : __( 'Standalone', 'standalone-html-importer' ) );
			if ( '1' === get_post_meta( $post_id, self::META_NAV, true ) ) {
				echo ' · ' . esc_html__( 'nav bar', 'standalone-html-importer' );
			}
		}
		if ( 'shi_url' === $column ) {
			$url = get_permalink( $post_id );
			printf( '<a href="%s" target="_blank">%s</a>', esc_url( $url ), esc_html( wp_make_link_relative( $url ) ) );
		}
	}

	/* ------------------------------------------------------------------ */
	/* Helpers                                                             */
	/* ------------------------------------------------------------------ */

	/**
	 * Users without unfiltered_html (non-admins, or all users on multisite
	 * unless super admin) get their HTML run through KSES.
	 */
	private static function sanitize_html_for_user( $html ) {
		if ( current_user_can( 'unfiltered_html' ) ) {
			return $html;
		}
		return wp_kses_post( $html );
	}

	private static function plain_text_excerpt( $html ) {
		if ( preg_match( '/<body[^>]*>(.*)<\/body>/is', $html, $m ) ) {
			$html = $m[1];
		}
		$html = preg_replace( '/<(script|style)\b[^>]*>.*?<\/\1>/is', ' ', $html );
		$text = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $html ) ) );
		return mb_substr( $text, 0, 5000 );
	}
}

Standalone_HTML_Importer::init();
