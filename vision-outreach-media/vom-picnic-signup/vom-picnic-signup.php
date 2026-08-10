<?php
/**
 * Plugin Name: Vision Outreach Picnic Sign-Up
 * Description: A shared picnic / potluck sign-up list. Guests add their name, headcount and the dishes or supplies they'll bring — all stored in your WordPress database. Add it to any page or post with the shortcode [picnic_signup]. Bilingual EN/NL.
 * Version: 1.0.0
 * Author: Vision Outreach Media
 * License: GPL-2.0-or-later
 * Text Domain: vom-picnic
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'VOM_PICNIC_VER', '1.0.0' );

function vom_picnic_table() {
	global $wpdb;
	return $wpdb->prefix . 'picnic_signups';
}

/* ---------- activation: create the table ---------- */
register_activation_hook( __FILE__, 'vom_picnic_activate' );
function vom_picnic_activate() {
	global $wpdb;
	$table   = vom_picnic_table();
	$charset = $wpdb->get_charset_collate();
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$sql = "CREATE TABLE $table (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		name VARCHAR(150) NOT NULL DEFAULT '',
		party_size INT NOT NULL DEFAULT 1,
		notes TEXT NULL,
		items LONGTEXT NULL,
		created DATETIME NOT NULL,
		PRIMARY KEY (id)
	) $charset;";
	dbDelta( $sql );
}

/* ---------- helpers ---------- */
function vom_picnic_parse_items( $raw ) {
	$out = array();
	$arr = json_decode( $raw, true );
	if ( is_array( $arr ) ) {
		foreach ( $arr as $it ) {
			if ( empty( $it['dish'] ) ) { continue; }
			$out[] = array(
				'id'       => isset( $it['id'] ) ? (string) $it['id'] : uniqid( 'i', true ),
				'category' => isset( $it['category'] ) ? sanitize_key( $it['category'] ) : '',
				'dish'     => sanitize_text_field( $it['dish'] ),
			);
		}
	}
	return $out;
}

function vom_picnic_state() {
	global $wpdb;
	$table = vom_picnic_table();
	$rows  = $wpdb->get_results( "SELECT * FROM $table ORDER BY id ASC", ARRAY_A );
	$items = array();
	$people = 0; $households = 0; $dishes = 0; $cats = array();
	if ( $rows ) {
		foreach ( $rows as $r ) {
			$its = vom_picnic_parse_items( $r['items'] );
			$items[] = array(
				'id'        => (string) $r['id'],
				'name'      => $r['name'],
				'partySize' => (int) $r['party_size'],
				'notes'     => $r['notes'],
				'items'     => $its,
			);
			$people += (int) $r['party_size'];
			$households++;
			foreach ( $its as $it ) {
				$dishes++;
				$c = $it['category'] ? $it['category'] : 'other';
				$cats[ $c ] = isset( $cats[ $c ] ) ? $cats[ $c ] + 1 : 1;
			}
		}
	}
	return array(
		'items'  => $items,
		'totals' => array( 'people' => $people, 'households' => $households, 'dishes' => $dishes, 'categories' => (object) $cats ),
	);
}

/* ---------- REST API ---------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'picnic/v1', '/state', array(
		'methods'             => 'GET',
		'callback'            => 'vom_picnic_rest_state',
		'permission_callback' => '__return_true',
	) );
	register_rest_route( 'picnic/v1', '/signup', array(
		'methods'             => 'POST',
		'callback'            => 'vom_picnic_rest_signup',
		'permission_callback' => '__return_true',
	) );
	register_rest_route( 'picnic/v1', '/remove', array(
		'methods'             => 'POST',
		'callback'            => 'vom_picnic_rest_remove',
		'permission_callback' => '__return_true',
	) );
} );

function vom_picnic_rest_state() {
	return rest_ensure_response( vom_picnic_state() );
}

function vom_picnic_rest_signup( WP_REST_Request $req ) {
	global $wpdb;
	$body  = $req->get_json_params();
	$name  = isset( $body['name'] ) ? sanitize_text_field( $body['name'] ) : '';
	$party = isset( $body['partySize'] ) ? max( 0, absint( $body['partySize'] ) ) : 0;
	$notes = isset( $body['notes'] ) ? sanitize_textarea_field( $body['notes'] ) : '';
	if ( $name === '' || $party < 1 ) {
		return new WP_Error( 'invalid', 'Name and headcount are required.', array( 'status' => 400 ) );
	}
	$clean = array();
	if ( isset( $body['items'] ) && is_array( $body['items'] ) ) {
		$i = 0;
		foreach ( $body['items'] as $it ) {
			if ( $i++ >= 30 ) { break; }
			$dish = isset( $it['dish'] ) ? sanitize_text_field( $it['dish'] ) : '';
			if ( $dish === '' ) { continue; }
			$clean[] = array(
				'id'       => uniqid( 'i', true ),
				'category' => isset( $it['category'] ) ? sanitize_key( $it['category'] ) : '',
				'dish'     => mb_substr( $dish, 0, 120 ),
			);
		}
	}
	$wpdb->insert( vom_picnic_table(), array(
		'name'       => mb_substr( $name, 0, 120 ),
		'party_size' => $party,
		'notes'      => mb_substr( $notes, 0, 500 ),
		'items'      => wp_json_encode( $clean ),
		'created'    => current_time( 'mysql' ),
	) );
	return rest_ensure_response( vom_picnic_state() );
}

function vom_picnic_rest_remove( WP_REST_Request $req ) {
	global $wpdb;
	$table  = vom_picnic_table();
	$body   = $req->get_json_params();
	$pid    = isset( $body['personId'] ) ? absint( $body['personId'] ) : 0;
	$itemId = ( isset( $body['itemId'] ) && $body['itemId'] ) ? (string) $body['itemId'] : '';
	if ( $pid < 1 ) {
		return new WP_Error( 'invalid', 'Missing id.', array( 'status' => 400 ) );
	}
	if ( $itemId === '' ) {
		$wpdb->delete( $table, array( 'id' => $pid ) );
	} else {
		$raw  = $wpdb->get_var( $wpdb->prepare( "SELECT items FROM $table WHERE id = %d", $pid ) );
		$kept = array();
		foreach ( vom_picnic_parse_items( $raw ) as $it ) {
			if ( (string) $it['id'] !== $itemId ) { $kept[] = $it; }
		}
		$wpdb->update( $table, array( 'items' => wp_json_encode( $kept ) ), array( 'id' => $pid ) );
	}
	return rest_ensure_response( vom_picnic_state() );
}

/* ---------- shortcode ---------- */
add_shortcode( 'picnic_signup', 'vom_picnic_shortcode' );
function vom_picnic_shortcode() {
	$cfg = '<script>window.PICNIC_CFG=' . wp_json_encode( array(
		'rest'  => esc_url_raw( rest_url( 'picnic/v1/' ) ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
	) ) . ';</script>';
	$app = <<<'VOMPICNIC_APP'
<style>

  :root{
    --navy:#071a2f; --navy2:#092033; --blue:#0b3d91; --teal:#00a6a6;
    --teal-l:#8be8e8; --orange:#ff8a3d; --ink:#102033; --muted:#5f6b7a;
    --soft:#f5f8fb; --line:#e4ebf2; --white:#fff;
    --shadow:0 8px 28px rgba(9,32,51,.10); --shadow-sm:0 2px 10px rgba(9,32,51,.06);
    --radius:16px;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink); background:linear-gradient(180deg,#eef4fb 0%,var(--soft) 240px,var(--soft) 100%);
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:860px; margin:0 auto; padding:0 16px 64px;}
  header.hero{
    position:relative; text-align:center; padding:52px 18px 30px; color:#fff;
    background:radial-gradient(120% 140% at 50% -20%, #0f4fb0 0%, var(--navy2) 55%, var(--navy) 100%);
    border-radius:0 0 26px 26px; box-shadow:var(--shadow);
  }
  .hero .kicker{letter-spacing:.14em; text-transform:uppercase; font-size:12px; color:var(--teal-l); font-weight:700;}
  .hero h1{margin:.35em 0 .15em; font-size:30px; line-height:1.12;}
  .hero p{margin:0 auto; max-width:520px; color:#cfe0f2; font-size:15.5px; line-height:1.5;}
  .langtoggle{
    position:absolute; top:14px; right:14px; display:inline-flex; gap:2px; padding:3px;
    background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.3); border-radius:999px; backdrop-filter:blur(4px);
  }
  .langtoggle button{
    appearance:none; border:none; cursor:pointer; font-family:inherit; font-weight:700; font-size:12.5px;
    color:#eaf2fd; background:transparent; padding:7px 13px; border-radius:999px; transition:all .15s; display:flex; align-items:center; gap:5px;
  }
  .langtoggle button.active{background:#fff; color:var(--blue); box-shadow:0 2px 8px rgba(0,0,0,.15);}
  .langtoggle button:not(.active):hover{color:#fff;}
  .stats{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:-26px auto 8px; max-width:640px; position:relative;}
  .stat{
    flex:1 1 150px; background:var(--white); border-radius:var(--radius); padding:16px 12px; text-align:center;
    box-shadow:var(--shadow); border:1px solid var(--line);
  }
  .stat b{display:block; font-size:30px; line-height:1; color:var(--blue); font-variant-numeric:tabular-nums;}
  .stat span{display:block; margin-top:6px; font-size:12.5px; color:var(--muted); font-weight:600; letter-spacing:.02em;}
  section.card{
    background:var(--white); border:1px solid var(--line); border-radius:var(--radius);
    box-shadow:var(--shadow-sm); padding:22px; margin-top:20px;
  }
  h2{font-size:19px; margin:0 0 4px; display:flex; align-items:center; gap:9px; flex-wrap:wrap;}
  h2 .sub{font-weight:400; font-size:13px; color:var(--muted);}
  .card > p.lead{margin:.2em 0 16px; color:var(--muted); font-size:14px; line-height:1.5;}
  label{display:block; font-weight:600; font-size:13.5px; margin:16px 0 6px;}
  input,select,textarea{
    width:100%; padding:13px; border:1.5px solid var(--line); border-radius:11px; font-size:15px;
    font-family:inherit; color:var(--ink); background:#fcfdff; transition:border-color .15s, box-shadow .15s;
  }
  input:focus,select:focus,textarea:focus{outline:none; border-color:var(--teal); box-shadow:0 0 0 3px rgba(0,166,166,.15);}
  textarea{resize:vertical; min-height:52px;}
  .req{color:var(--orange); font-weight:800;}
  .row{display:flex; gap:14px; flex-wrap:wrap;}
  .row > .col{flex:1 1 200px;}
  .row > .col.small{flex:0 1 160px;}
  .subhelp{margin:3px 0 10px; font-size:13px; color:var(--muted); line-height:1.5;}
  /* headcount stepper */
  .stepper{display:flex; align-items:stretch;}
  .stepper input{text-align:center; border-radius:0; border-left:none; border-right:none; -moz-appearance:textfield;}
  .stepper input::-webkit-outer-spin-button,.stepper input::-webkit-inner-spin-button{-webkit-appearance:none; margin:0;}
  .stepper .stp{flex:0 0 48px; border:1.5px solid var(--line); background:#f1f6fc; font-size:22px; font-weight:700; color:var(--blue); cursor:pointer; line-height:1;}
  .stepper .stp:first-child{border-radius:11px 0 0 11px;}
  .stepper .stp:last-child{border-radius:0 11px 11px 0;}
  .stepper .stp:hover{background:#e4eefb;}
  /* category tabs — real folder tabs, icon-only so all six fit in one row */
  .tabwrap{position:relative; margin-top:10px; z-index:1;}
  .tabbar{display:flex; gap:5px; padding-top:3px;}
  .tab{flex:1 1 0; min-width:0; justify-content:center; cursor:pointer; border:1.5px solid var(--line); border-bottom:none; background:#eef3f9; color:var(--muted); font-family:inherit; font-size:19px; padding:11px 4px 12px; border-radius:11px 11px 0 0; display:flex; align-items:center; gap:5px; white-space:nowrap; margin-bottom:-1.5px; position:relative; transition:background .12s;}
  .tab:hover{background:#e3ebf5;}
  .tab.active{background:#fff; border-top:3px solid var(--orange); padding-top:9px; z-index:3;}
  .tab .dot{width:8px; height:8px; border-radius:50%; background:var(--orange); box-shadow:0 0 0 2px #eef3f9;}
  .tab.active .dot{box-shadow:0 0 0 2px #fff;}
  .tabpanel{border:1.5px solid var(--line); border-radius:12px; padding:15px; position:relative; z-index:2;}
  .panel-title{display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 0 13px; font-weight:700; font-size:15.5px; color:var(--navy2);}
  .panel-title .pcount{font-size:11.5px; font-weight:700; color:var(--muted); background:var(--soft); padding:4px 11px; border-radius:999px; white-space:nowrap;}
  .panel-title .pcount.zero{background:#fff1e6; color:#a85b1e;}
  .chips{display:flex; flex-wrap:wrap; gap:9px; min-height:44px;}
  .chip{
    cursor:pointer; font-size:14px; font-weight:600; color:var(--blue); background:#eef4ff;
    border:1.5px solid #dbe7ff; padding:11px 15px; border-radius:999px; transition:all .12s; user-select:none; line-height:1;
  }
  .chip:hover{background:var(--blue); color:#fff; border-color:var(--blue);}
  .chip.selected{background:var(--teal); color:#fff; border-color:var(--teal);}
  .chip.selected:hover{background:#00918f; border-color:#00918f;}
  .chip.selected::before{content:'✓ '; font-weight:800;}
  .chip.taken{background:#f3f7fb; border-color:var(--line); color:#4a6b8a;}
  .chip.taken::before{content:'✓ '; color:var(--teal); font-weight:800;}
  /* add-your-own */
  .addown{display:flex; gap:9px; margin-top:14px;}
  .addown input{flex:1 1 auto;}
  .addbtn{flex:0 0 auto; min-height:48px; padding:0 18px; border:none; border-radius:11px; background:var(--blue); color:#fff; font-size:15px; font-weight:700; cursor:pointer; white-space:nowrap; transition:background .15s;}
  .addbtn:hover{background:#0a3378;}
  /* your-list tray */
  .tray{margin-top:16px; border:1.5px dashed #cfe0f2; border-radius:13px; padding:13px; background:#fbfdff;}
  .tray-head{display:flex; align-items:center; gap:9px; font-weight:700; font-size:13.5px; color:var(--navy2);}
  .tray-count{font-size:12px; font-weight:700; background:var(--teal); color:#fff; min-width:22px; text-align:center; padding:2px 8px; border-radius:999px;}
  .tray-count.zero{background:var(--soft); color:var(--muted);}
  .basket{display:flex; flex-wrap:wrap; gap:8px; margin-top:11px;}
  .basket .tag{display:inline-flex; align-items:center; gap:8px; background:#e6fafa; color:#0a6b6b; border:1px solid #b8ebeb; border-radius:999px; padding:9px 9px 9px 14px; font-size:14px; font-weight:600;}
  .basket .tag .x{border:none; background:rgba(0,0,0,.09); color:#0a6b6b; width:24px; height:24px; border-radius:50%; cursor:pointer; font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; padding:0;}
  .basket .tag .x:hover{background:var(--orange); color:#fff;}
  .basket .bhint{color:var(--muted); font-size:13px; line-height:1.5; padding:3px 0 1px;}
  .btn{
    appearance:none; border:none; cursor:pointer; font-family:inherit; font-weight:700; font-size:15.5px;
    padding:15px 22px; border-radius:12px; color:#fff; background:linear-gradient(180deg,#ff9a53,var(--orange));
    box-shadow:0 6px 16px rgba(255,138,61,.32); transition:transform .06s, box-shadow .15s;
  }
  .btn:hover{box-shadow:0 8px 22px rgba(255,138,61,.4);}
  .btn:active{transform:translateY(1px);}
  .btn[disabled]{opacity:.6; cursor:default; box-shadow:none;}
  .btn.full{width:100%; margin-top:20px;}
  .hint{font-size:12.5px; color:var(--muted); margin-top:9px; line-height:1.5;}
  .lg-title{font-weight:700; font-size:14px; color:var(--navy2); margin:0 0 8px; display:flex; align-items:center; gap:8px;}
  .listgroup{margin-top:18px;}
  .listgroup:first-of-type{margin-top:4px;}
  .item{
    display:flex; align-items:flex-start; gap:12px; padding:13px 14px; border:1px solid var(--line);
    border-radius:12px; margin-bottom:8px; background:#fcfdff;
  }
  .item .dish{font-weight:700; font-size:14.5px;}
  .item .meta{font-size:12.5px; color:var(--muted); margin-top:2px;}
  .item .who{font-weight:600; color:var(--blue);}
  .item .grow{flex:1; min-width:0;}
  .rm{flex:0 0 auto; cursor:pointer; border:none; background:transparent; color:#b7c2cd; font-size:22px; line-height:1; padding:4px 8px; border-radius:8px;}
  .rm:hover{color:var(--orange); background:#fff2e9;}
  .empty{color:var(--muted); font-size:14px; text-align:center; padding:22px 8px;}
  .needed{width:100%; text-align:left; background:#fff7f0; border:1px solid #ffe0c7; color:#a85b1e; border-radius:12px; padding:12px 14px; font-size:13.5px; margin-top:6px; cursor:pointer; font-family:inherit; transition:background .15s;}
  .needed:hover{background:#fff0e2;}
  .needed b{color:#8a4a16;}
  .toolbar{display:flex; align-items:center; gap:10px; margin-top:4px;}
  .link{background:none; border:none; color:var(--blue); font-weight:600; cursor:pointer; font-size:13.5px; padding:6px 4px;}
  .link:hover{text-decoration:underline;}
  .foot{text-align:center; color:var(--muted); font-size:12.5px; margin-top:26px; line-height:1.6;}
  .toast{
    position:fixed; left:50%; bottom:22px; transform:translateX(-50%) translateY(20px); opacity:0;
    background:var(--navy2); color:#fff; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:600;
    box-shadow:var(--shadow); transition:all .25s; pointer-events:none; z-index:50; max-width:90%; text-align:center;
  }
  .toast.show{opacity:1; transform:translateX(-50%) translateY(0);}
  .loading{text-align:center; color:var(--muted); padding:26px; font-size:14px;}
  .spin{display:inline-block; width:16px; height:16px; border:2.5px solid var(--line); border-top-color:var(--teal); border-radius:50%; animation:sp .7s linear infinite; vertical-align:-3px; margin-right:8px;}
  @keyframes sp{to{transform:rotate(360deg)}}

</style>
<header class="hero">
    <div class="langtoggle" id="langToggle">
      <button data-lang="en">🇬🇧 EN</button>
      <button data-lang="nl">🇳🇱 NL</button>
    </div>
    <div class="kicker" id="i_kicker">You're invited</div>
    <h1 id="eventTitle">Church Family Picnic</h1>
    <p id="eventBlurb"></p>
  </header>

  <div class="wrap">
    <div class="stats">
      <div class="stat"><b id="stPeople">0</b><span id="i_stPeople">People coming</span></div>
      <div class="stat"><b id="stDishes">0</b><span id="i_stDishes">Items signed up</span></div>
      <div class="stat"><b id="stCats">0</b><span id="i_stCats">Categories covered</span></div>
    </div>

    <div id="neededWrap"></div>

    <section class="card" id="formCard">
      <h2><span id="i_formTitle">🧺 Add your sign-up</span></h2>
      <p class="lead" id="i_formLead"></p>

      <div class="row">
        <div class="col">
          <label for="name"><span id="i_nameLabel">Your name</span> <span class="req">*</span></label>
          <input id="name" type="text" autocomplete="name">
        </div>
        <div class="col small">
          <label><span id="i_partyLabel"># of people</span> <span class="req">*</span></label>
          <div class="stepper">
            <button type="button" class="stp" id="pMinus" aria-label="fewer people">−</button>
            <input id="party" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="number of people">
            <button type="button" class="stp" id="pPlus" aria-label="more people">+</button>
          </div>
        </div>
      </div>

      <label><span id="i_bringLabel">What are you bringing?</span> <span id="i_bringOpt" style="font-weight:400;color:var(--muted)"></span></label>
      <p class="subhelp" id="i_bringHelp"></p>
      <div class="tabwrap"><div id="sugTabs" class="tabbar"></div></div>
      <div id="suggestions" class="tabpanel"></div>
      <div class="addown">
        <input id="dish" type="text">
        <button type="button" class="addbtn" id="addBtn">＋ <span id="i_addBtn">Add</span></button>
      </div>

      <div class="tray">
        <div class="tray-head"><span id="i_trayTitle">Your list</span> <span class="tray-count zero" id="trayCount">0</span></div>
        <div class="basket" id="basket"></div>
      </div>

      <label for="notes"><span id="i_notesLabel">Notes</span> <span id="i_notesExtra" style="font-weight:400;color:var(--muted)"></span></label>
      <textarea id="notes"></textarea>
      <button class="btn full" id="submitBtn">Add me to the picnic</button>
      <div class="hint" id="i_formHint"></div>
    </section>

    <section class="card">
      <h2><span id="i_listTitle">🍽️ What's being brought</span> <span class="sub" id="listSub"></span></h2>
      <div class="toolbar">
        <button class="link" id="refreshBtn">↻ Refresh list</button>
      </div>
      <div id="list"><div class="loading"><span class="spin"></span></div></div>
    </section>

    <p class="foot" id="i_foot"></p>
  </div>

  <div class="toast" id="toast"></div>
<script>

  /* ============================================================
     Bilingual picnic sign-up (English / Nederlands)
     One flow: tap tabs → tap ideas (or type your own) → they collect
     in "Your list" → submit. Each person can bring several items.
     ============================================================ */

  var CATEGORIES = [
    {key:'mains', emoji:'🍗',
      en:{name:'Mains & Grill', ideas:['BBQ chicken','Sausages / hot dogs','Burgers','Rice dish','Veggie skewers']},
      nl:{name:'Hoofdgerechten', ideas:['BBQ-kip','Worstjes / hotdogs','Hamburgers','Rijstgerecht','Groentespiesjes']}},
    {key:'sides', emoji:'🥗',
      en:{name:'Salads & Sides', ideas:['Green salad','Potato salad','Pasta salad','Bread rolls','Chips & dip']},
      nl:{name:'Salades & Bijgerechten', ideas:['Groene salade','Aardappelsalade','Pastasalade','Broodjes','Chips & dip']}},
    {key:'fruit', emoji:'🍉',
      en:{name:'Fruit', ideas:['Watermelon','Fruit salad','Grapes','Berries']},
      nl:{name:'Fruit', ideas:['Watermeloen','Fruitsalade','Druiven','Bessen']}},
    {key:'desserts', emoji:'🍰',
      en:{name:'Desserts', ideas:['Cake','Brownies','Cookies','Fruit tart']},
      nl:{name:'Nagerechten', ideas:['Taart','Brownies','Koekjes','Vruchtentaart']}},
    {key:'drinks', emoji:'🥤',
      en:{name:'Drinks', ideas:['Water','Lemonade','Iced tea','Juice','Coffee & tea']},
      nl:{name:'Drankjes', ideas:['Water','Limonade','IJsthee','Sap','Koffie & thee']}},
    {key:'supplies', emoji:'🧺',
      en:{name:'Supplies', ideas:['Plates','Cups','Napkins','Cutlery','Trash bags','Cooler with ice']},
      nl:{name:'Benodigdheden', ideas:['Bordjes','Bekers','Servetten','Bestek','Vuilniszakken','Koelbox met ijs']}}
  ];

  var TXT = {
    en:{
      kicker:"You're invited", title:'Church Family Picnic',
      blurb:"Let's share a meal together! Add your name so we know you're coming, then add anything you'd like to bring. Every bit helps.",
      stPeople:'People coming', stDishes:'Items signed up', stCats:'Categories covered',
      formTitle:'🧺 Add your sign-up',
      formLead:'Coming with family? Add your household once and tell us how many are coming.',
      nameLabel:'Your name', namePh:'e.g. The Joseph family',
      partyLabel:'# of people',
      bringLabel:'What are you bringing?', bringOpt:'(optional)',
      bringHelp:'Tap the ideas below, or type your own. Add as many as you like — a dish, a drink, some plates…',
      addOwnPh:'Add your own idea…', addBtn:'Add',
      trayTitle:'Your list', basketHint:'Nothing added yet. Your items will show up here. 🙂',
      notesLabel:'Notes', notesExtra:'(optional — dietary info, etc.)', notesPh:'e.g. Vegetarian, contains nuts',
      submit:'Add me to the picnic', submitWith:function(n){return 'Add me + '+n+' item'+(n===1?'':'s')+' →';}, submitting:'Adding…',
      formHint:"Just coming, not bringing anything? That's fine — leave the list empty and add yourself so we get the headcount right.",
      listTitle:"🍽️ What's being brought", refresh:'↻ Refresh list',
      loading:'Loading the list…', refreshing:'Refreshing…',
      empty:'No sign-ups yet — be the first! 🎉', comingAlong:'🙌 Coming along',
      neededPrefix:'Still needed:', neededSuffix:'— tap to add one', people:'people', signedUp:'signed up',
      signups:function(n){return '('+n+' sign-up'+(n===1?'':'s')+')';},
      foot:'Every sign-up is saved to a Google Sheet the organizer owns.<br>Made with care by Vision Outreach Media 🌿',
      tAddedItem:function(x){return 'Added: '+x;},
      tAdded:"You're on the list — thank you! 🎉", tRemoved:function(x){return 'Removed '+x;},
      tNeedName:'Please add your name', tNeedParty:'How many are coming?',
      tSaveErr:'Could not save — try again', tRemoveErr:'Could not remove — try again',
      tLoadErr:"Couldn't load the list. Please refresh."
    },
    nl:{
      kicker:'Je bent uitgenodigd', title:'Gemeente Picknick',
      blurb:'Laten we samen eten! Meld je aan zodat we weten dat je komt, en voeg toe wat je mee wilt nemen. Alle beetjes helpen.',
      stPeople:'Aantal personen', stDishes:'Aangemelde items', stCats:'Categorieën gedekt',
      formTitle:'🧺 Meld je aan',
      formLead:'Kom je met je gezin? Meld je huishouden één keer aan en geef aan met hoeveel personen je komt.',
      nameLabel:'Je naam', namePh:'bijv. Familie Joseph',
      partyLabel:'Aantal pers.',
      bringLabel:'Wat neem je mee?', bringOpt:'(optioneel)',
      bringHelp:'Tik op de ideeën hieronder of typ je eigen. Voeg zoveel toe als je wilt — een gerecht, drankje, bordjes…',
      addOwnPh:'Voeg je eigen idee toe…', addBtn:'Toevoegen',
      trayTitle:'Jouw lijstje', basketHint:'Nog niets toegevoegd. Je items verschijnen hier. 🙂',
      notesLabel:'Opmerkingen', notesExtra:'(optioneel — dieetinfo, enz.)', notesPh:'bijv. vegetarisch, bevat noten',
      submit:'Zet mij op de lijst', submitWith:function(n){return 'Aanmelden + '+n+' item'+(n===1?'':'s')+' →';}, submitting:'Bezig…',
      formHint:'Kom je alleen, zonder iets mee te nemen? Prima — laat het lijstje leeg en meld je aan zodat de telling klopt.',
      listTitle:'🍽️ Wat wordt er meegenomen', refresh:'↻ Lijst vernieuwen',
      loading:'De lijst laden…', refreshing:'Vernieuwen…',
      empty:'Nog geen aanmeldingen — wees de eerste! 🎉', comingAlong:'🙌 Komen gezellig mee',
      neededPrefix:'Nog nodig:', neededSuffix:'— tik om toe te voegen', people:'pers.', signedUp:'aangemeld',
      signups:function(n){return '('+n+' aanmelding'+(n===1?'':'en')+')';},
      foot:'Elke aanmelding wordt opgeslagen in een Google Sheet van de organisator.<br>Met zorg gemaakt door Vision Outreach Media 🌿',
      tAddedItem:function(x){return 'Toegevoegd: '+x;},
      tAdded:'Je staat op de lijst — bedankt! 🎉', tRemoved:function(x){return x+' verwijderd';},
      tNeedName:'Vul je naam in', tNeedParty:'Met hoeveel personen kom je?',
      tSaveErr:'Opslaan mislukt — probeer opnieuw', tRemoveErr:'Verwijderen mislukt — probeer opnieuw',
      tLoadErr:'Kan de lijst niet laden. Vernieuw de pagina.'
    }
  };

  var LANG = (navigator.language||'en').toLowerCase().indexOf('nl')===0 ? 'nl' : 'en';
  var STATE = {items:[], totals:{people:0,households:0,dishes:0,categories:{}}};
  var BASKET = [];
  var ACTIVE_TAB = CATEGORIES[0].key;
  var _lastTabScroll = null;
  var busy = false;

  function el(id){return document.getElementById(id);}
  function T(){return TXT[LANG];}
  function cat(c){return c[LANG];}
  function catByKey(k){for(var i=0;i<CATEGORIES.length;i++){if(CATEGORIES[i].key===k)return CATEGORIES[i];}return null;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(s){return String(s||'').toLowerCase().trim();}
  function toast(msg){var t=el('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},2400);}

  function applyLang(){
    var t=T();
    document.documentElement.lang=LANG;
    el('i_kicker').textContent=t.kicker;
    el('eventTitle').textContent=t.title;
    el('eventBlurb').textContent=t.blurb;
    el('i_stPeople').textContent=t.stPeople;
    el('i_stDishes').textContent=t.stDishes;
    el('i_stCats').textContent=t.stCats;
    el('i_formTitle').textContent=t.formTitle;
    el('i_formLead').textContent=t.formLead;
    el('i_nameLabel').textContent=t.nameLabel;
    el('name').placeholder=t.namePh;
    el('i_partyLabel').textContent=t.partyLabel;
    el('i_bringLabel').textContent=t.bringLabel;
    el('i_bringOpt').textContent=t.bringOpt;
    el('i_bringHelp').textContent=t.bringHelp;
    el('dish').placeholder=t.addOwnPh;
    el('i_addBtn').textContent=t.addBtn;
    el('i_trayTitle').textContent=t.trayTitle;
    el('i_notesLabel').textContent=t.notesLabel;
    el('i_notesExtra').textContent=t.notesExtra;
    el('notes').placeholder=t.notesPh;
    el('i_formHint').textContent=t.formHint;
    el('i_listTitle').textContent=t.listTitle;
    el('refreshBtn').textContent=t.refresh;
    el('i_foot').innerHTML=t.foot;
    Array.prototype.forEach.call(el('langToggle').querySelectorAll('button'),function(b){
      b.classList.toggle('active', b.getAttribute('data-lang')===LANG);
    });
    renderAll();
  }

  /* ---------- BASKET (multi-item) ---------- */
  function basketIndex(catKey, dish){
    for(var i=0;i<BASKET.length;i++){ if(BASKET[i].category===catKey && norm(BASKET[i].dish)===norm(dish)) return i; }
    return -1;
  }
  function addToBasket(catKey, dish){
    dish=(dish||'').trim(); if(!dish) return;
    if(basketIndex(catKey,dish)>-1){ toast(T().tAddedItem(dish)); return; }
    BASKET.push({category:catKey, dish:dish});
    renderBasket(); renderSuggestions(); updateSubmit();
    toast(T().tAddedItem(dish));
  }
  function toggleBasket(catKey, dish){
    var idx=basketIndex(catKey,dish);
    if(idx>-1){ BASKET.splice(idx,1); renderBasket(); renderSuggestions(); updateSubmit(); }
    else { addToBasket(catKey,dish); }
  }
  function renderBasket(){
    var host=el('basket');
    el('trayCount').textContent=BASKET.length;
    el('trayCount').className='tray-count'+(BASKET.length?'':' zero');
    if(!BASKET.length){ host.innerHTML='<div class="bhint">'+esc(T().basketHint)+'</div>'; return; }
    host.innerHTML=BASKET.map(function(it,i){
      var c=catByKey(it.category); var emo=c?c.emoji:'🍴';
      return '<span class="tag">'+emo+' '+esc(it.dish)+'<button class="x" data-i="'+i+'" aria-label="remove">✕</button></span>';
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('.x'),function(b){
      b.onclick=function(){ BASKET.splice(parseInt(b.getAttribute('data-i'),10),1); renderBasket(); renderSuggestions(); updateSubmit(); };
    });
  }
  function updateSubmit(){
    el('submitBtn').textContent = BASKET.length? T().submitWith(BASKET.length) : T().submit;
  }
  function addCustom(){
    var dish=el('dish').value.trim();
    if(!dish){ el('dish').focus(); return; }
    addToBasket(ACTIVE_TAB, dish);
    el('dish').value=''; el('dish').focus();
  }

  /* ---------- rendering ---------- */
  function takenDishes(){
    var m={};
    STATE.items.forEach(function(p){ (p.items||[]).forEach(function(it){ if(it.dish) m[it.category+'|'+norm(it.dish)]=true; }); });
    return m;
  }

  function renderSuggestions(){
    var taken=takenDishes();
    var tabsHost=el('sugTabs'); tabsHost.innerHTML='';
    CATEGORIES.forEach(function(c){
      var count=(STATE.totals.categories[c.key]||0);
      var tab=document.createElement('button');
      tab.type='button';
      tab.className='tab'+(c.key===ACTIVE_TAB?' active':'');
      tab.title=cat(c).name;
      tab.setAttribute('aria-label', cat(c).name);
      tab.innerHTML='<span>'+c.emoji+'</span>'+((count===0 && c.key!=='supplies')?'<span class="dot"></span>':'');
      tab.onclick=function(){ ACTIVE_TAB=c.key; renderSuggestions(); };
      tabsHost.appendChild(tab);
    });
    var c=catByKey(ACTIVE_TAB)||CATEGORIES[0];
    var ac=(STATE.totals.categories[c.key]||0);
    var host=el('suggestions'); host.innerHTML='';
    var ttl=document.createElement('div'); ttl.className='panel-title';
    ttl.innerHTML='<span>'+c.emoji+' '+esc(cat(c).name)+'</span><span class="pcount'+(ac===0?' zero':'')+'">'+ac+' '+esc(T().signedUp)+'</span>';
    host.appendChild(ttl);
    var chips=document.createElement('div'); chips.className='chips';
    cat(c).ideas.forEach(function(idea){
      var chip=document.createElement('span');
      var cls='chip';
      if(basketIndex(c.key,idea)>-1) cls+=' selected';
      else if(taken[c.key+'|'+norm(idea)]) cls+=' taken';
      chip.className=cls; chip.textContent=idea;
      chip.onclick=function(){ toggleBasket(c.key, idea); };
      chips.appendChild(chip);
    });
    host.appendChild(chips);
  }

  function renderStats(){
    el('stPeople').textContent=STATE.totals.people;
    el('stDishes').textContent=STATE.totals.dishes;
    el('stCats').textContent=Object.keys(STATE.totals.categories).length;
  }

  function missingCats(){
    return CATEGORIES.filter(function(c){return c.key!=='supplies' && !(STATE.totals.categories[c.key]>0);});
  }
  function renderNeeded(){
    var t=T(); var missing=missingCats(); var wrap=el('neededWrap');
    if(STATE.items.length===0 || missing.length===0){wrap.innerHTML=''; return;}
    var names=missing.map(function(c){return c.emoji+' '+cat(c).name;}).join(' · ');
    wrap.innerHTML='<button class="needed" id="neededBtn"><b>'+esc(t.neededPrefix)+'</b> '+esc(names)+' '+esc(t.neededSuffix)+'</button>';
    el('neededBtn').onclick=function(){
      var m=missingCats(); if(m.length){ ACTIVE_TAB=m[0].key; renderSuggestions(); }
      el('formCard').scrollIntoView({behavior:'smooth',block:'start'});
    };
  }

  function renderList(){
    var t=T(); var host=el('list');
    el('listSub').textContent=STATE.items.length? t.signups(STATE.totals.households):'';
    if(STATE.items.length===0){ host.innerHTML='<div class="empty">'+esc(t.empty)+'</div>'; return; }
    var groups={}; var justComing=[];
    STATE.items.forEach(function(p){
      var its=p.items||[];
      if(!its.length){ justComing.push(p); return; }
      its.forEach(function(it){ (groups[it.category]=groups[it.category]||[]).push({p:p, it:it}); });
    });
    var html='';
    function line(entry){
      var p=entry.p, it=entry.it;
      var ppl=p.partySize>0? ' · '+p.partySize+' '+esc(t.people):'';
      var meta='<span class="who">'+esc(p.name)+'</span>'+ppl+(p.notes?' — '+esc(p.notes):'');
      return '<div class="item"><div class="grow"><div class="dish">'+esc(it.dish)+'</div><div class="meta">'+meta+'</div></div>'+
             '<button class="rm" aria-label="remove" data-p="'+esc(p.id)+'" data-it="'+esc(it.id)+'" data-name="'+esc(it.dish)+'">&times;</button></div>';
    }
    CATEGORIES.forEach(function(c){
      var arr=groups[c.key]; if(!arr||!arr.length) return;
      html+='<div class="listgroup"><div class="lg-title">'+c.emoji+' '+esc(cat(c).name)+'</div>';
      arr.forEach(function(e){ html+=line(e); });
      html+='</div>';
    });
    Object.keys(groups).forEach(function(k){
      if(catByKey(k)) return;
      html+='<div class="listgroup"><div class="lg-title">🍴 '+esc(k||'Other')+'</div>';
      groups[k].forEach(function(e){ html+=line(e); });
      html+='</div>';
    });
    if(justComing.length){
      html+='<div class="listgroup"><div class="lg-title">'+esc(t.comingAlong)+'</div>';
      justComing.forEach(function(p){
        var ppl=p.partySize>0? p.partySize+' '+esc(t.people):'';
        html+='<div class="item"><div class="grow"><div class="dish">'+esc(p.name)+'</div>'+
              (ppl||p.notes?'<div class="meta">'+ppl+(p.notes?(ppl?' — ':'')+esc(p.notes):'')+'</div>':'')+'</div>'+
              '<button class="rm" aria-label="remove" data-p="'+esc(p.id)+'" data-name="'+esc(p.name)+'">&times;</button></div>';
      });
      html+='</div>';
    }
    host.innerHTML=html;
    Array.prototype.forEach.call(host.querySelectorAll('.rm'),function(b){
      b.onclick=function(){ removeEntry(b.getAttribute('data-p'), b.getAttribute('data-it'), b.getAttribute('data-name')); };
    });
  }

  function renderAll(){ renderStats(); renderNeeded(); renderSuggestions(); renderList(); renderBasket(); updateSubmit(); }

  /* ---------- backend calls (WordPress REST API) ---------- */
  var CFG = window.PICNIC_CFG || {rest:'', nonce:''};
  function api(path, opts){
    opts = opts||{};
    opts.headers = Object.assign({'Content-Type':'application/json','X-WP-Nonce':CFG.nonce}, opts.headers||{});
    opts.credentials='same-origin';
    return fetch(CFG.rest+path, opts).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
  }
  function onState(st){ STATE=st||STATE; renderAll(); }
  function loadState(){ api('state').then(onState).catch(function(err){ el('list').innerHTML='<div class="empty">'+esc(T().tLoadErr)+'</div>'; console.error(err); }); }

  function submit(){
    if(busy) return;
    var t=T();
    var name=el('name').value.trim();
    var party=parseInt(el('party').value,10);
    if(!name){ toast(t.tNeedName); el('name').focus(); return; }
    if(!party||party<1){ toast(t.tNeedParty); el('party').focus(); return; }
    if(el('dish').value.trim()){ addToBasket(ACTIVE_TAB, el('dish').value.trim()); el('dish').value=''; }
    busy=true; var btn=el('submitBtn'); btn.disabled=true; btn.textContent=t.submitting;
    var payload={name:name, partySize:party, notes:el('notes').value.trim(), items:BASKET.slice()};
    api('signup',{method:'POST', body:JSON.stringify(payload)}).then(function(st){
      onState(st); busy=false; btn.disabled=false;
      BASKET=[]; el('dish').value=''; el('notes').value=''; el('name').value=''; el('party').value=1;
      renderBasket(); updateSubmit();
      toast(T().tAdded);
      el('formCard').scrollIntoView({behavior:'smooth',block:'start'});
    }).catch(function(err){ busy=false; btn.disabled=false; updateSubmit(); toast(T().tSaveErr); console.error(err); });
  }

  function removeEntry(personId, itemId, name){
    if(busy) return;
    busy=true;
    api('remove',{method:'POST', body:JSON.stringify({personId:personId, itemId:itemId||null})}).then(function(st){ onState(st); busy=false; toast(T().tRemoved(name||'')); })
      .catch(function(err){ busy=false; toast(T().tRemoveErr); console.error(err); });
  }

  function stepParty(d){ var i=el('party'); var v=(parseInt(i.value,10)||0)+d; if(v<1)v=1; if(v>99)v=99; i.value=v; }
  el('pMinus').onclick=function(){ stepParty(-1); };
  el('pPlus').onclick=function(){ stepParty(1); };
  el('addBtn').onclick=addCustom;
  el('dish').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); addCustom(); } });
  el('submitBtn').onclick=submit;
  el('refreshBtn').onclick=function(){ el('list').innerHTML='<div class="loading"><span class="spin"></span>'+esc(T().refreshing)+'</div>'; loadState(); };
  Array.prototype.forEach.call(el('langToggle').querySelectorAll('button'),function(b){
    b.onclick=function(){ LANG=b.getAttribute('data-lang'); applyLang(); };
  });

  applyLang();
  el('list').innerHTML='<div class="loading"><span class="spin"></span>'+esc(T().loading)+'</div>';
  loadState();

</script>
VOMPICNIC_APP;
	return '<div class="vom-picnic-app">' . $cfg . $app . '</div>';
}

/* ---------- admin page + CSV export ---------- */
add_action( 'admin_menu', function () {
	add_menu_page( 'Picnic Sign-Ups', 'Picnic Sign-Ups', 'manage_options', 'vom-picnic', 'vom_picnic_admin_page', 'dashicons-carrot', 26 );
} );

function vom_picnic_admin_page() {
	$state  = vom_picnic_state();
	$t      = $state['totals'];
	$export = wp_nonce_url( admin_url( 'admin-post.php?action=vom_picnic_export' ), 'vom_picnic_export' );
	echo '<div class="wrap"><h1>Picnic Sign-Ups</h1>';
	echo '<p style="font-size:14px">Add the sign-up form to any page with the shortcode <code>[picnic_signup]</code>.</p>';
	echo '<p><strong>' . intval( $t['people'] ) . '</strong> people &nbsp;&middot;&nbsp; <strong>' . intval( $t['households'] ) . '</strong> sign-ups &nbsp;&middot;&nbsp; <strong>' . intval( $t['dishes'] ) . '</strong> items &nbsp; <a class="button button-primary" href="' . esc_url( $export ) . '" style="margin-left:12px">Export CSV</a></p>';
	echo '<table class="widefat striped"><thead><tr><th>Name</th><th>People</th><th>Bringing</th><th>Notes</th></tr></thead><tbody>';
	if ( empty( $state['items'] ) ) {
		echo '<tr><td colspan="4">No sign-ups yet.</td></tr>';
	} else {
		foreach ( $state['items'] as $p ) {
			$dishes = array();
			foreach ( $p['items'] as $it ) { $dishes[] = esc_html( $it['dish'] ); }
			echo '<tr><td><strong>' . esc_html( $p['name'] ) . '</strong></td><td>' . intval( $p['partySize'] ) . '</td><td>' . ( $dishes ? implode( ', ', $dishes ) : '&mdash;' ) . '</td><td>' . esc_html( $p['notes'] ) . '</td></tr>';
		}
	}
	echo '</tbody></table></div>';
}

add_action( 'admin_post_vom_picnic_export', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'vom_picnic_export' ) ) { wp_die( 'Not allowed' ); }
	$state = vom_picnic_state();
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=picnic-signups.csv' );
	$out = fopen( 'php://output', 'w' );
	fputcsv( $out, array( 'Name', 'People', 'Category', 'Dish', 'Notes' ) );
	foreach ( $state['items'] as $p ) {
		if ( empty( $p['items'] ) ) {
			fputcsv( $out, array( $p['name'], $p['partySize'], '', '(just coming)', $p['notes'] ) );
		} else {
			foreach ( $p['items'] as $it ) {
				fputcsv( $out, array( $p['name'], $p['partySize'], $it['category'], $it['dish'], $p['notes'] ) );
			}
		}
	}
	fclose( $out );
	exit;
} );
