export const es = {
  start_tab_title: "Inicio",
  log_tab_title: "Registro",
  settings_tab_title: "Ajustes",
  tab_today: "Hoy",
  tab_bible: "Biblia",
  tab_calendar: "Calendario",
  tab_checklist: "Lista",

  start_title: "Inicio",
  start_subtitle: "Usa las pestañas de abajo para navegar.",

  log_title: "Registro",
  add: "Agregar",

  today_title: "Hoy",
  today_daily_goal: "Meta diaria",
  verses_lowercase: "versículos",
  today_progress_meta_with_goal: "%{pct}% • %{read} / %{goal} %{verses}",
  today_progress_meta_no_goal: "%{read} %{verses}",
  today_empty_title: "Todavía no hay entradas",
  today_empty_text: "Agrega lo que leíste hoy para seguir tu progreso.",
  today_entry_meta: "%{new} nuevos • %{total} versículos en total",

  bible_books_title: "Libros de la Biblia",
  bible_book_title: "Libro",

  loading_log_entries: "Cargando registros…",

  empty_title: "Todavía no hay registros",
  empty_text: 'Toca “Agregar” para crear tu primera entrada.',
  empty_cta: "Agregar un registro",

  add_log_entry_title: "Agregar registro",
  edit_log_entry_title: "Editar registro",
  save: "Guardar",
  cancel: "Cancelar",

  start_verse_id_label: "ID de versículo inicial",
  end_verse_id_label: "ID de versículo final",
  date_label: "Fecha",
  start_verse_id_placeholder: "p. ej. 1001001",
  end_verse_id_placeholder: "p. ej. 1001005",
  date_placeholder: "AAAA-MM-DD",

  verses: "Versículos",

  menu_edit: "Editar",
  menu_delete: "Eliminar",
  menu_open_in_bible: "Abrir en la Biblia",
  menu_log_reading: "Agregar lectura",

  delete_confirm_title: "¿Eliminar registro?",
  delete_confirm_message: "Esta acción no se puede deshacer.",

  error_invalid_entry_title: "Entrada inválida",
  error_invalid_entry_message: "Por favor completa todos los campos.",
  error_invalid_verses_title: "Versículos inválidos",
  error_invalid_verses_message:
    "Los ID de versículo deben ser números positivos.",
  error_invalid_range_title: "Rango inválido",
  error_invalid_range_message:
    "El ID de versículo final debe ser mayor o igual al inicial.",

  settings_title: "Ajustes",
  settings_language_label: "Idioma",
  language_english: "English",
  language_spanish: "Español",
  settings_language_help: "Los cambios se aplican al instante.",

  settings_theme_label: "Tema",
  theme_system: "Sistema",
  theme_light: "Claro",
  theme_dark: "Oscuro",
  settings_theme_help: "“Sistema” sigue la configuración del dispositivo.",

  settings_auth_label: "Cuenta",
  auth_loading: "Comprobando sesión…",
  auth_logged_in_as: "Sesión iniciada como",
  auth_login: "Iniciar sesión",
  auth_logout: "Cerrar sesión",

  login_title: "Iniciar sesión",
  auth_email: "Correo electrónico",
  auth_password: "Contraseña",
  login_button: "Iniciar sesión",
  login_sign_in_again_as: "Iniciar sesión de nuevo como %{email}",
  auth_invalid_credentials: "Correo o contraseña incorrectos.",
  auth_generic_error: "Algo salió mal. Inténtalo de nuevo.",
  auth_login_hint: "Inicia sesión con la misma cuenta que usas en la web.",
  login_with_google: "Continuar con Google",

  upgrade_required_title: "Actualización requerida",
  upgrade_required_message:
    "Se requiere una versión más nueva de la app para seguir usando el servicio.",
  upgrade_required_details:
    "Versión actual: %{current} • Mínimo compatible: %{min}",
  upgrade_required_button: "Actualizar app",
  upgrade_required_no_store_url:
    "Actualiza la app desde App Store / Play Store.",

  // log entry editor (mirrors Nuxt)
  preview_passage: "Vista previa del pasaje",
  date: "Fecha",
  book: "Libro",
  choose_book: "Elegir libro",
  start_chapter: "Capítulo de inicio",
  choose_start_chapter: "Elegir capítulo de inicio",
  start_verse: "Versículo de inicio",
  choose_start_verse: "Elegir versículo de inicio",
  end_chapter: "Capítulo final",
  choose_end_chapter: "Elegir capítulo final",
  end_verse: "Versículo final",
  choose_end_verse: "Elegir versículo final",
  close: "Cerrar",
  discard: "Descartar",
  discard_changes_title: "¿Descartar cambios?",
  discard_changes_message: "¿Cerrar sin guardar tus cambios?",

  settings_connectivity_label: "Conectividad",
  connectivity_online: "En línea",
  connectivity_offline: "Sin conexión",
  connectivity_unknown: "Desconocido",

  settings_section_account: "Cuenta",
  settings_section_account_subtitle: "Inicio de sesión y conectividad",
  settings_section_reading: "Lectura",
  settings_section_reading_subtitle: "Preferencias de lectura",
  settings_section_appearance: "Apariencia",
  settings_section_appearance_subtitle: "Tema y visualización",
  settings_section_language: "Idioma",
  settings_section_language_subtitle: "Elige tu idioma",

  settings_select_option: "Seleccionar una opción",
  settings_reading_daily_goal_title: "Meta de Versículos Diarios",
  settings_reading_look_back_date_title: "Fecha de Revisión",
  settings_reading_preferred_bible_version_title: "Versión de la Biblia Preferida",
  settings_reading_preferred_bible_app_title: "Aplicación de Biblia Preferida",
  settings_reading_local_only_notice:
    "Inicia sesión para sincronizar estos ajustes con tu cuenta. (La app preferida es solo de este dispositivo.)",

  settings_saved_successfully: "Guardado.",
  settings_save_invalid: "Revisa el valor e inténtalo de nuevo.",

  calendar_today: "Hoy",
  calendar_no_entries: "No hay entradas",
  calendar_verses: "versículos",
  calendar_open_bible_failed: "No se pudo abrir la Biblia.",

  chapter_checklist: "Lista de capítulos",
  loading: "Cargando...",
  logged_before_today:
    "Este capítulo se registró antes de hoy. Puedes editar entradas anteriores en la página del Calendario.",
  unable_to_mark_complete: "No se puede marcar el capítulo como completo.",
  unable_to_mark_incomplete: "No se puede marcar el capítulo como incompleto.",
} as const;

