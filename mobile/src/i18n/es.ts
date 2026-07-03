import type { en } from "./en";

// `satisfies` guarantees at compile time that every English key has a Spanish
// translation (and no stray keys exist) — a missing key is a type error, not a
// silent runtime fallback.
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
  empty_text: "Toca “Agregar” para crear tu primera entrada.",
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
  error_invalid_verses_message: "Los ID de versículo deben ser números positivos.",
  error_invalid_range_title: "Rango inválido",
  error_invalid_range_message: "El ID de versículo final debe ser mayor o igual al inicial.",

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
  auth_email_required: "Ingresa tu correo electrónico.",
  auth_password_required: "Ingresa tu contraseña.",
  auth_login_hint: "Inicia sesión con la misma cuenta que usas en la web.",
  login_with_email: "Iniciar sesión",
  login_divider_or: "o",
  login_with_google: "Continuar con Google",

  // Mensajes de error de la API (refleja `api_error.*` de Nuxt; por código de error)
  api_error_unknown_error: "Ocurrió un error desconocido",
  api_error_network_error:
    "No se puede llegar al servidor. Por favor verifica tu conexión e intenta de nuevo.",
  api_error_validation_error: "Hubo un error con su solicitud",
  api_error_required: "Se requiere un %{field}",
  api_error_is_invalid: "Por favor ingrese un %{field} válido",
  api_error_unique: "Este %{field} ya está en uso",
  api_error_min_length: "Debe tener %{minlength} o más caracteres",
  api_error_max_length: "Debe tener %{maxlength} o menos caracteres",
  api_error_review: "Por favor revise.",
  api_error_not_found: "No encontrado",
  api_error_invalid_login: "El correo electrónico o la contraseña son incorrectos",
  api_error_verify_email: "Por favor revise %{email} para verificar su correo electrónico primero",
  api_error_new_email_required:
    "El nuevo correo electrónico no puede ser el mismo que el correo electrónico actual",
  api_error_email_in_use: "La dirección de correo electrónico ya está en uso",
  api_error_password_incorrect: "La contraseña es incorrecta",
  api_error_account_not_found: "Cuenta no encontrada",
  api_error_password_reset_link_expired: "El enlace de restablecimiento de contraseña ha caducado",
  api_error_too_many_requests: "Se enviaron demasiadas solicitudes en un corto período de tiempo",
  api_error_invalid_request: "Solicitud inválida",
  api_error_email_not_verified: "Correo electrónico no verificado",
  api_error_verification_code_expired: "El código de verificación ha caducado",

  upgrade_required_title: "Actualización requerida",
  upgrade_required_message:
    "Se requiere una versión más nueva de la app para seguir usando el servicio.",
  upgrade_required_details: "Versión actual: %{current} • Mínimo compatible: %{min}",
  upgrade_required_button: "Actualizar app",
  upgrade_required_no_store_url: "Actualiza la app desde App Store / Play Store.",

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
  date_picker_done: "Listo",

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
  settings_section_about: "Acerca de",
  settings_section_about_subtitle: "Versión, privacidad y términos",

  // About screen
  about_app_label: "Aplicación",
  about_version: "Versión",
  about_legal_label: "Legal",
  about_privacy_policy: "Política de privacidad",
  about_terms: "Términos y condiciones",
  about_website: "Visitar sitio web",
  about_open_link_failed: "No se pudo abrir el enlace.",

  // Account deletion
  account_danger_zone_label: "Zona de peligro",
  account_delete_button: "Eliminar cuenta",
  delete_account_title: "Eliminar cuenta",
  delete_account_description:
    "Usted está en control de sus datos. Puede eliminar permanentemente su cuenta y todos los datos asociados con ella:",
  delete_account_list_account:
    "Esto eliminará permanentemente su cuenta y configuraciones personales.",
  delete_account_list_log_entries: "Esto eliminará permanentemente sus entradas de registro.",
  delete_account_list_notes: "Esto eliminará permanentemente sus notas y etiquetas personalizadas.",
  delete_account_list_permanent: "Esta acción no se puede revertir.",
  delete_account_understand_log_entries:
    "Entiendo que esto eliminará todos los datos de mis entradas de registro.",
  delete_account_understand_notes: "Entiendo que esto eliminará todas mis notas y etiquetas.",
  delete_account_understand_permanent:
    "Entiendo que esta acción es permanente y no se puede revertir.",
  delete_account_confirm_button: "Eliminar mi cuenta",
  delete_account_confirm_title: "¿Eliminar cuenta?",
  delete_account_confirm_message:
    "Esto eliminará permanentemente su cuenta y todos los datos. Esta acción no se puede deshacer.",
  delete_account_deleting: "Eliminando cuenta…",
  delete_account_unable: "No se puede eliminar la cuenta. Por favor, inténtelo de nuevo más tarde.",

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
  calendar_prev_month: "Mes anterior",
  calendar_next_month: "Mes siguiente",
  calendar_day_verses_read: "%{count} versículos leídos",

  dismiss: "Descartar",
  offline_banner: "Sin conexión: los cambios se sincronizarán cuando te vuelvas a conectar.",
  today_no_goal_hint:
    "Establece una meta diaria en Ajustes → Lectura para seguir tu progreso aquí.",
  chapter_read_a11y: "%{book} capítulo %{chapter}, leído",
  chapter_unread_a11y: "%{book} capítulo %{chapter}, no leído",

  chapter_checklist: "Lista de capítulos",
  loading: "Cargando...",
  logged_before_today:
    "Este capítulo se registró antes de hoy. Puedes editar entradas anteriores en la página del Calendario.",
  unable_to_mark_complete: "No se puede marcar el capítulo como completo.",
  unable_to_mark_incomplete: "No se puede marcar el capítulo como incompleto.",
} as const satisfies Record<keyof typeof en, string>;
