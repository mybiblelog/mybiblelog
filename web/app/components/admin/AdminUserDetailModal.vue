<template>
  <app-modal :open="open" :title="t('title')" @close="emit('close')">
    <template #content>
      <div>
        <p class="mbl-text-small mbl-text-muted">
          {{ t('email') }}
        </p>
        <p>{{ user?.email || '—' }}</p>
      </div>
      <br>
      <div>
        <p class="mbl-text-small mbl-text-muted">
          {{ t('login_methods') }}
        </p>
        <div class="admin-user-detail__login-methods">
          <span v-if="user?.googleId" class="admin-user-detail__login-badge">{{ t('login_google') }}</span>
          <span v-if="user?.hasLocalAccount" class="admin-user-detail__login-badge">{{ t('login_password') }}</span>
          <span v-if="!user?.googleId && !user?.hasLocalAccount" class="mbl-text-muted">—</span>
        </div>
      </div>
      <br>
      <div v-if="statsLoading" class="admin-user-detail__loading mbl-text-muted mbl-text-small">
        {{ t('loading') }}
      </div>
      <div v-else-if="statsError" class="admin-user-detail__error mbl-text-small">
        {{ t('stats_error') }}
      </div>
      <dl v-else-if="stats" class="admin-user-detail__stats">
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('join_date') }}
          </dt>
          <dd>{{ stats.joinDate ? stats.joinDate.split('T')[0] : '—' }}<span v-if="stats.joinDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.joinDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('feedbacks') }}
          </dt>
          <dd>{{ stats.feedbackCount }}</dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('last_log_entry') }}
          </dt>
          <dd>{{ stats.lastLogEntryDate || '—' }}<span v-if="stats.lastLogEntryDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.lastLogEntryDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('log_entries') }}
          </dt>
          <dd>{{ stats.logEntryCount }}</dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('last_note') }}
          </dt>
          <dd>{{ stats.lastNoteDate ? stats.lastNoteDate.split('T')[0] : '—' }}<span v-if="stats.lastNoteDate" class="admin-user-detail__days-ago"> ({{ daysAgo(stats.lastNoteDate) }})</span></dd>
        </div>
        <div class="admin-user-detail__stat">
          <dt class="mbl-text-small mbl-text-muted">
            {{ t('notes') }}
          </dt>
          <dd>{{ stats.noteCount }}</dd>
        </div>
      </dl>

      <div v-if="user" class="admin-user-detail__actions mbl-button-group">
        <button class="mbl-button mbl-button--primary" type="button" :disabled="statsError" @click="signInAsUser">
          {{ t('sign_in_as_user') }}
        </button>
        <button v-if="allowDelete" class="mbl-button mbl-button--danger" type="button" @click="deleteUser">
          {{ t('delete_user') }}
        </button>
      </div>
    </template>
    <template #footer>
      <button class="mbl-button" type="button" @click="emit('close')">
        {{ t('close') }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import { displayTimeSince } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import { sessionStore } from '~/helpers/app-storage';
import { useDialogStore } from '~/stores/dialog';
import { useAuthStore } from '~/stores/auth';

interface AdminUser {
  email: string;
  googleId?: string;
  hasLocalAccount?: boolean;
}

interface UserStats {
  joinDate?: string;
  feedbackCount: number;
  lastLogEntryDate?: string;
  logEntryCount: number;
  lastNoteDate?: string;
  noteCount: number;
}

const props = withDefaults(defineProps<{
  user: AdminUser | null;
  open: boolean;
  allowDelete?: boolean;
}>(), {
  user: null,
  open: false,
  allowDelete: true,
});

const emit = defineEmits<{
  close: [];
  'user-deleted': [];
}>();

const { $http } = useNuxtApp();
const { t, locale } = useI18n();
const dialogStore = useDialogStore();
const authStore = useAuthStore();
const router = useRouter();

const stats = ref<UserStats | null>(null);
const statsLoading = ref(false);
const statsError = ref(false);

// Bumped on every load/close so a stale response from a rapid reopen (or user switch)
// can't overwrite state from a request that's since been superseded.
let statsRequestId = 0;

function daysAgo(dateStr: string) {
  return displayTimeSince(dateStr, locale.value);
}

async function loadStats() {
  const requestId = ++statsRequestId;
  stats.value = null;
  statsError.value = false;
  statsLoading.value = true;
  try {
    const { data } = await $http.get<UserStats>(`/api/admin/users/${props.user!.email}/stats`);
    if (requestId !== statsRequestId) { return; }
    stats.value = data;
  }
  catch {
    if (requestId !== statsRequestId) { return; }
    statsError.value = true;
  }
  finally {
    if (requestId === statsRequestId) {
      statsLoading.value = false;
    }
  }
}

async function signInAsUser() {
  const confirmed = await dialogStore.confirm({ message: t('confirm_sign_in') });
  if (!confirmed) { return; }
  try {
    sessionStore.clearAll();
    await $http.get(`/api/admin/users/${props.user!.email}/login`);
    await authStore.refreshUser();
    emit('close');
    router.push('/start');
  }
  catch {
    await dialogStore.alert({ message: t('error_sign_in') });
  }
}

async function deleteUser() {
  if (props.user!.email === authStore.user?.email) {
    await dialogStore.alert({ message: t('error_delete_self') });
    return;
  }
  let confirmed = await dialogStore.confirm({
    message: t('confirm_delete', { email: props.user!.email }),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  confirmed = await dialogStore.confirm({
    message: t('confirm_delete_final', { email: props.user!.email }),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await $http.delete(`/api/admin/users/${props.user!.email}`);
    emit('user-deleted');
  }
  catch {
    await dialogStore.alert({ message: t('error_delete') });
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.user) {
    loadStats();
  }
  else {
    statsRequestId += 1;
    stats.value = null;
    statsLoading.value = false;
    statsError.value = false;
  }
});
</script>

<style scoped>
.admin-user-detail__loading,
.admin-user-detail__error {
  margin-bottom: var(--mbl-space-md);
}

.admin-user-detail__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mbl-space-sm) var(--mbl-space-xl);
  margin: 0 0 var(--mbl-space-lg);
}

.admin-user-detail__stat dt {
  margin-bottom: var(--mbl-space-3xs);
}

.admin-user-detail__stat dd {
  margin: 0;
  font-weight: 500;
}

.admin-user-detail__days-ago {
  font-weight: 400;
  opacity: 0.6;
  font-size: 0.875em;
}

.admin-user-detail__login-methods {
  display: flex;
  gap: var(--mbl-space-xs);
  flex-wrap: wrap;
  margin-top: var(--mbl-space-2xs);
}

.admin-user-detail__login-badge {
  display: inline-block;
  padding: var(--mbl-space-3xs) var(--mbl-space-xs);
  border-radius: var(--mbl-radius-pill);
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--mbl-surface-2, #e9ecef);
  color: var(--mbl-text, inherit);
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "User Details",
    "email": "Email",
    "login_methods": "Login Methods",
    "login_google": "Google",
    "login_password": "Password",
    "loading": "Loading...",
    "stats_error": "Unable to load user details. This account was likely deleted.",
    "join_date": "Join Date",
    "feedbacks": "Feedbacks",
    "last_log_entry": "Last Log Entry",
    "log_entries": "Log Entries",
    "last_note": "Last Note",
    "notes": "Notes",
    "sign_in_as_user": "Sign In As User",
    "delete_user": "Delete User",
    "close": "Close",
    "confirm_sign_in": "Are you sure you want to sign in as this user? You will be logged out of your own account.",
    "error_sign_in": "Unable to sign in as user.",
    "error_delete_self": "You cannot delete your own account.",
    "confirm_delete": "Are you sure you want to delete account \"{email}\"? This action cannot be undone.",
    "confirm_delete_final": "Are you absolutely certain? The account \"{email}\" will be completely removed from the system.",
    "error_delete": "Unable to delete user."
  },
  "de": {
    "title": "Benutzerdetails",
    "email": "E-Mail",
    "login_methods": "Anmeldemethoden",
    "login_google": "Google",
    "login_password": "Passwort",
    "loading": "Lädt...",
    "stats_error": "Benutzerdetails konnten nicht geladen werden. Dieses Konto wurde wahrscheinlich gelöscht.",
    "join_date": "Beitrittsdatum",
    "feedbacks": "Feedbacks",
    "last_log_entry": "Letzter Eintrag",
    "log_entries": "Einträge",
    "last_note": "Letzte Notiz",
    "notes": "Notizen",
    "sign_in_as_user": "Als Benutzer anmelden",
    "delete_user": "Benutzer löschen",
    "close": "Schließen",
    "confirm_sign_in": "Möchten Sie sich wirklich als dieser Benutzer anmelden? Sie werden von Ihrem eigenen Konto abgemeldet.",
    "error_sign_in": "Anmeldung als Benutzer nicht möglich.",
    "error_delete_self": "Sie können Ihr eigenes Konto nicht löschen.",
    "confirm_delete": "Möchten Sie das Konto \"{email}\" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    "confirm_delete_final": "Sind Sie ganz sicher? Das Konto \"{email}\" wird vollständig aus dem System entfernt.",
    "error_delete": "Benutzer konnte nicht gelöscht werden."
  },
  "es": {
    "title": "Detalles del Usuario",
    "email": "Correo electrónico",
    "login_methods": "Métodos de Inicio de Sesión",
    "login_google": "Google",
    "login_password": "Contraseña",
    "loading": "Cargando...",
    "stats_error": "No se pudieron cargar los detalles del usuario. Es probable que esta cuenta haya sido eliminada.",
    "join_date": "Fecha de Registro",
    "feedbacks": "Comentarios",
    "last_log_entry": "Último Registro",
    "log_entries": "Registros",
    "last_note": "Última Nota",
    "notes": "Notas",
    "sign_in_as_user": "Iniciar Sesión Como Usuario",
    "delete_user": "Eliminar Usuario",
    "close": "Cerrar",
    "confirm_sign_in": "¿Seguro que quieres iniciar sesión como este usuario? Se cerrará la sesión de tu propia cuenta.",
    "error_sign_in": "No se pudo iniciar sesión como este usuario.",
    "error_delete_self": "No puedes eliminar tu propia cuenta.",
    "confirm_delete": "¿Seguro que quieres eliminar la cuenta \"{email}\"? Esta acción no se puede deshacer.",
    "confirm_delete_final": "¿Estás completamente seguro? La cuenta \"{email}\" se eliminará por completo del sistema.",
    "error_delete": "No se pudo eliminar el usuario."
  },
  "fr": {
    "title": "Détails de l'Utilisateur",
    "email": "E-mail",
    "login_methods": "Méthodes de Connexion",
    "login_google": "Google",
    "login_password": "Mot de passe",
    "loading": "Chargement...",
    "stats_error": "Impossible de charger les détails de l'utilisateur. Ce compte a probablement été supprimé.",
    "join_date": "Date d'Inscription",
    "feedbacks": "Retours",
    "last_log_entry": "Dernière Entrée",
    "log_entries": "Entrées",
    "last_note": "Dernière Note",
    "notes": "Notes",
    "sign_in_as_user": "Se Connecter En Tant Qu'Utilisateur",
    "delete_user": "Supprimer l'Utilisateur",
    "close": "Fermer",
    "confirm_sign_in": "Voulez-vous vraiment vous connecter en tant que cet utilisateur ? Vous serez déconnecté de votre propre compte.",
    "error_sign_in": "Impossible de se connecter en tant que cet utilisateur.",
    "error_delete_self": "Vous ne pouvez pas supprimer votre propre compte.",
    "confirm_delete": "Voulez-vous vraiment supprimer le compte \"{email}\" ? Cette action est irréversible.",
    "confirm_delete_final": "En êtes-vous absolument certain ? Le compte \"{email}\" sera entièrement supprimé du système.",
    "error_delete": "Impossible de supprimer l'utilisateur."
  },
  "ko": {
    "title": "사용자 상세",
    "email": "이메일",
    "login_methods": "로그인 방법",
    "login_google": "Google",
    "login_password": "비밀번호",
    "loading": "불러오는 중…",
    "stats_error": "사용자 정보를 불러올 수 없습니다. 이 계정은 삭제된 것으로 보입니다.",
    "join_date": "가입일",
    "feedbacks": "피드백",
    "last_log_entry": "최근 기록",
    "log_entries": "기록 수",
    "last_note": "최근 노트",
    "notes": "노트 수",
    "sign_in_as_user": "이 사용자로 로그인",
    "delete_user": "사용자 삭제",
    "close": "닫기",
    "confirm_sign_in": "이 사용자로 로그인하시겠습니까? 현재 계정에서 로그아웃됩니다.",
    "error_sign_in": "이 사용자로 로그인할 수 없습니다.",
    "error_delete_self": "본인 계정은 삭제할 수 없습니다.",
    "confirm_delete": "\"{email}\" 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    "confirm_delete_final": "정말 확실합니까? \"{email}\" 계정이 시스템에서 완전히 삭제됩니다.",
    "error_delete": "사용자를 삭제할 수 없습니다."
  },
  "pt": {
    "title": "Detalhes do Usuário",
    "email": "E-mail",
    "login_methods": "Métodos de Login",
    "login_google": "Google",
    "login_password": "Senha",
    "loading": "Carregando...",
    "stats_error": "Não foi possível carregar os detalhes do usuário. Esta conta provavelmente foi excluída.",
    "join_date": "Data de Cadastro",
    "feedbacks": "Feedbacks",
    "last_log_entry": "Último Registro",
    "log_entries": "Registros",
    "last_note": "Última Nota",
    "notes": "Notas",
    "sign_in_as_user": "Entrar Como Usuário",
    "delete_user": "Excluir Usuário",
    "close": "Fechar",
    "confirm_sign_in": "Tem certeza de que deseja entrar como este usuário? Você sairá da sua própria conta.",
    "error_sign_in": "Não foi possível entrar como este usuário.",
    "error_delete_self": "Você não pode excluir sua própria conta.",
    "confirm_delete": "Tem certeza de que deseja excluir a conta \"{email}\"? Esta ação não pode ser desfeita.",
    "confirm_delete_final": "Tem absoluta certeza? A conta \"{email}\" será completamente removida do sistema.",
    "error_delete": "Não foi possível excluir o usuário."
  },
  "uk": {
    "title": "Деталі користувача",
    "email": "Електронна пошта",
    "login_methods": "Способи входу",
    "login_google": "Google",
    "login_password": "Пароль",
    "loading": "Завантаження...",
    "stats_error": "Не вдалося завантажити дані користувача. Цей обліковий запис, імовірно, було видалено.",
    "join_date": "Дата реєстрації",
    "feedbacks": "Відгуки",
    "last_log_entry": "Останній запис",
    "log_entries": "Записи",
    "last_note": "Остання нотатка",
    "notes": "Нотатки",
    "sign_in_as_user": "Увійти як користувач",
    "delete_user": "Видалити користувача",
    "close": "Закрити",
    "confirm_sign_in": "Ви впевнені, що хочете увійти як цей користувач? Ви вийдете зі свого облікового запису.",
    "error_sign_in": "Не вдалося увійти як цей користувач.",
    "error_delete_self": "Ви не можете видалити власний обліковий запис.",
    "confirm_delete": "Ви впевнені, що хочете видалити обліковий запис \"{email}\"? Цю дію не можна скасувати.",
    "confirm_delete_final": "Ви цілком упевнені? Обліковий запис \"{email}\" буде повністю видалено із системи.",
    "error_delete": "Не вдалося видалити користувача."
  }
}
</i18n>
