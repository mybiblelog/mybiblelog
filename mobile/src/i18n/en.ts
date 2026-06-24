export const en = {
  start_tab_title: "Start",
  log_tab_title: "Log",
  settings_tab_title: "Settings",
  tab_today: "Today",
  tab_bible: "Bible",
  tab_calendar: "Calendar",
  tab_checklist: "Checklist",

  start_title: "Start",
  start_subtitle: "Use the tabs below to navigate.",

  log_title: "Log",
  add: "Add",

  today_title: "Today",
  today_daily_goal: "Daily goal",
  verses_lowercase: "verses",
  today_progress_meta_with_goal: "%{pct}% • %{read} / %{goal} %{verses}",
  today_progress_meta_no_goal: "%{read} %{verses}",
  today_empty_title: "No entries yet",
  today_empty_text: "Add what you read today to track your progress.",
  today_entry_meta: "%{new} new • %{total} total verses",

  bible_books_title: "Bible Books",
  bible_book_title: "Book",

  loading_log_entries: "Loading log entries…",

  empty_title: "No log entries yet",
  empty_text: 'Tap “Add” to create your first entry.',
  empty_cta: "Add a log entry",

  add_log_entry_title: "Add Log Entry",
  edit_log_entry_title: "Edit Log Entry",
  save: "Save",
  cancel: "Cancel",

  start_verse_id_label: "Start verse ID",
  end_verse_id_label: "End verse ID",
  date_label: "Date",
  start_verse_id_placeholder: "e.g. 1001001",
  end_verse_id_placeholder: "e.g. 1001005",
  date_placeholder: "YYYY-MM-DD",

  verses: "Verses",

  menu_edit: "Edit",
  menu_delete: "Delete",
  menu_open_in_bible: "Open in Bible",
  menu_log_reading: "Log reading",

  delete_confirm_title: "Delete log entry?",
  delete_confirm_message: "This cannot be undone.",

  error_invalid_entry_title: "Invalid entry",
  error_invalid_entry_message: "Please fill out all fields.",
  error_invalid_verses_title: "Invalid verses",
  error_invalid_verses_message: "Verse IDs must be positive numbers.",
  error_invalid_range_title: "Invalid range",
  error_invalid_range_message:
    "End verse ID must be greater than or equal to start verse ID.",

  settings_title: "Settings",
  settings_language_label: "Language",
  language_english: "English",
  language_spanish: "Español",
  settings_language_help: "Changes apply immediately.",

  settings_theme_label: "Theme",
  theme_system: "System",
  theme_light: "Light",
  theme_dark: "Dark",
  settings_theme_help: "System follows your device setting.",

  settings_auth_label: "Account",
  auth_loading: "Checking login…",
  auth_logged_in_as: "Signed in as",
  auth_login: "Login",
  auth_logout: "Logout",

  login_title: "Login",
  auth_email: "Email",
  auth_password: "Password",
  login_button: "Login",
  login_sign_in_again_as: "Sign in again as %{email}",
  auth_invalid_credentials: "Invalid email or password.",
  auth_generic_error: "Something went wrong. Please try again.",
  auth_login_hint: "Sign in with the same account you use on the web app.",
  login_with_google: "Continue with Google",

  upgrade_required_title: "Update required",
  upgrade_required_message:
    "A newer version of the app is required to continue using the service.",
  upgrade_required_details: "Current version: %{current} • Minimum supported: %{min}",
  upgrade_required_button: "Update app",
  upgrade_required_no_store_url:
    "Please update the app from the App Store / Play Store.",

  // log entry editor (mirrors Nuxt)
  preview_passage: "Preview passage",
  date: "Date",
  book: "Book",
  choose_book: "Choose Book",
  start_chapter: "Start Chapter",
  choose_start_chapter: "Choose Start Chapter",
  start_verse: "Start Verse",
  choose_start_verse: "Choose Start Verse",
  end_chapter: "End Chapter",
  choose_end_chapter: "Choose End Chapter",
  end_verse: "End Verse",
  choose_end_verse: "Choose End Verse",
  close: "Close",
  discard: "Discard",
  discard_changes_title: "Discard changes?",
  discard_changes_message: "Close without saving your changes?",

  settings_connectivity_label: "Connectivity",
  connectivity_online: "Online",
  connectivity_offline: "Offline",
  connectivity_unknown: "Unknown",

  settings_section_account: "Account",
  settings_section_account_subtitle: "Login and connectivity",
  settings_section_reading: "Reading",
  settings_section_reading_subtitle: "Reading preferences",
  settings_section_appearance: "Appearance",
  settings_section_appearance_subtitle: "Theme and display",
  settings_section_language: "Language",
  settings_section_language_subtitle: "Choose your language",

  settings_select_option: "Select an option",
  settings_reading_daily_goal_title: "Daily Verse Count Goal",
  settings_reading_look_back_date_title: "Look Back Date",
  settings_reading_preferred_bible_version_title: "Preferred Bible Version",
  settings_reading_preferred_bible_app_title: "Preferred Bible App",
  settings_reading_local_only_notice:
    "Sign in to sync these settings to your account. (Preferred Bible App is device-only.)",

  settings_saved_successfully: "Saved.",
  settings_save_invalid: "Please check the value and try again.",

  calendar_today: "Today",
  calendar_no_entries: "No Entries",
  calendar_verses: "verses",
  calendar_open_bible_failed: "Unable to open Bible app.",

  chapter_checklist: "Chapter Checklist",
  loading: "Loading...",
  logged_before_today:
    "This chapter was logged before today. You can edit previous log entries on the Calendar page.",
  unable_to_mark_complete: "Unable to mark the chapter complete.",
  unable_to_mark_incomplete: "Unable to mark the chapter incomplete.",
} as const;

