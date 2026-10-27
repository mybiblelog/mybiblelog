<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('access_tokens') }}
    </h2>
    <div class="mbl-content">
      <p>{{ t('intro') }}</p>
      <p>{{ t('intro_safety') }}</p>
    </div>

    <div v-if="createdToken" class="mbl-message mbl-message--success" data-testid="access-token-created">
      <div class="mbl-message__header">
        {{ t('created_header') }}
      </div>
      <div class="mbl-message__body">
        <p>{{ t('created_body') }}</p>
        <div class="mbl-field mbl-field--addons">
          <div class="mbl-control access-tokens__token-control">
            <input
              class="mbl-input"
              type="text"
              readonly
              :value="createdToken"
              data-testid="access-token-value"
              @focus="selectAll"
            >
          </div>
          <div class="mbl-control">
            <button class="mbl-button mbl-button--primary" type="button" @click="copyToken">
              {{ copied ? t('copied') : t('copy') }}
            </button>
          </div>
        </div>
        <button class="mbl-button mbl-button--sm mbl-button--light" type="button" @click="createdToken = ''">
          {{ t('done') }}
        </button>
      </div>
    </div>

    <h3 class="mbl-title mbl-title--5 access-tokens__section">
      {{ t('create_token') }}
    </h3>
    <form @submit.prevent="createToken">
      <div v-if="errors._form" class="mbl-help mbl-help--danger">
        {{ $terr(errors._form) }}
      </div>
      <div class="mbl-field">
        <label class="mbl-label" for="access-token-name">{{ t('name') }}</label>
        <div class="mbl-control">
          <input
            id="access-token-name"
            v-model="form.name"
            class="mbl-input"
            type="text"
            maxlength="60"
            :placeholder="t('name_placeholder')"
            data-testid="access-token-name"
            :disabled="!mounted"
          >
        </div>
        <div v-if="errors.name" class="mbl-help mbl-help--danger">
          {{ $terr(errors.name) }}
        </div>
      </div>
      <div class="mbl-field">
        <span class="mbl-label">{{ t('permissions') }}</span>
        <div v-for="scope in ACCESS_TOKEN_SCOPES" :key="scope" class="mbl-control">
          <label class="mbl-checkbox">
            <input v-model="form.scopes" type="checkbox" :value="scope" :data-testid="`access-token-scope-${scope}`" :disabled="!mounted">
            {{ scopeLabel(scope) }}
          </label>
        </div>
        <div v-if="errors.scopes" class="mbl-help mbl-help--danger">
          {{ $terr(errors.scopes) }}
        </div>
        <p class="mbl-help">
          {{ t('never_allowed') }}
        </p>
      </div>
      <div class="mbl-field">
        <label class="mbl-label" for="access-token-expiry">{{ t('expires_after') }}</label>
        <div class="mbl-control">
          <div class="mbl-select">
            <select id="access-token-expiry" v-model="form.expiresInDays" data-testid="access-token-expiry" :disabled="!mounted">
              <option v-for="days in ACCESS_TOKEN_EXPIRY_DAYS" :key="days" :value="days">
                {{ t('days', { days }) }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <div class="mbl-field">
        <div class="mbl-control">
          <button class="mbl-button mbl-button--primary" type="submit" :disabled="!mounted || busy" data-testid="access-token-create">
            {{ t('create_button') }}
          </button>
        </div>
      </div>
    </form>

    <h3 class="mbl-title mbl-title--5 access-tokens__section">
      {{ t('your_tokens') }}
    </h3>
    <p v-if="loaded && !tokens.length" class="mbl-text-muted">
      {{ t('no_tokens') }}
    </p>
    <div v-else-if="tokens.length" class="mbl-table-wrap">
      <table class="mbl-table mbl-table--striped access-tokens__table" data-testid="access-token-list">
        <thead>
          <tr>
            <th>{{ t('name') }}</th>
            <th>{{ t('permissions') }}</th>
            <th>{{ t('expires') }}</th>
            <th>{{ t('last_used') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in tokens" :key="token.id" :data-testid="`access-token-row-${token.id}`">
            <td>
              {{ token.name }}
              <div class="mbl-text-small mbl-text-muted">
                <code>{{ token.prefix }}…</code>
              </div>
            </td>
            <td>
              <div v-for="scope in token.scopes" :key="scope" class="mbl-text-small">
                {{ scopeLabel(scope) }}
              </div>
            </td>
            <td>
              <span v-if="isExpired(token)" class="mbl-text-danger">{{ t('expired') }}</span>
              <span v-else>{{ formatDate(token.expiresAt) }}</span>
            </td>
            <td>{{ token.lastUsedAt ? formatDate(token.lastUsedAt) : t('never') }}</td>
            <td>
              <button
                class="mbl-button mbl-button--sm mbl-button--danger"
                type="button"
                :disabled="!mounted || busy"
                :data-testid="`access-token-revoke-${token.id}`"
                @click="revokeToken(token)"
              >
                {{ t('revoke') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ACCESS_TOKEN_EXPIRY_DAYS,
  ACCESS_TOKEN_SCOPES,
  DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS,
  type AccessTokenExpiryDays,
  type AccessTokenScope,
} from '@mybiblelog/shared';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';

type AccessToken = {
  id: string;
  name: string;
  prefix: string;
  scopes: AccessTokenScope[];
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
};

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);

const { t, locale } = useI18n();
const dialogStore = useDialogStore();
const toastStore = useToastStore();
const { $http, $terr } = useNuxtApp();

const busy = ref(false);
const loaded = ref(false);
const tokens = ref<AccessToken[]>([]);
const createdToken = ref('');
const copied = ref(false);

const form = reactive<{ name: string; scopes: AccessTokenScope[]; expiresInDays: AccessTokenExpiryDays }>({
  name: '',
  scopes: [],
  expiresInDays: DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS,
});
const errors = reactive<Record<string, ApiErrorDetail | null>>({ _form: null, name: null, scopes: null });

function resetErrors() {
  errors._form = null;
  errors.name = null;
  errors.scopes = null;
}

// vue-i18n reads `:` in a key path as syntax, so the message keys use `_`.
const scopeLabel = (scope: AccessTokenScope) => t(`scope.${scope.replace(':', '_')}`);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { dateStyle: 'medium' });
const isExpired = (token: AccessToken) => new Date(token.expiresAt).getTime() <= Date.now();

async function loadTokens() {
  try {
    const { data } = await $http.get<AccessToken[]>('/api/access-tokens');
    tokens.value = data;
  }
  catch {
    toastStore.add({ type: 'error', text: t('load_error') });
  }
  finally {
    loaded.value = true;
  }
}

onMounted(async () => {
  mounted.value = true;
  await loadTokens();
});

async function createToken() {
  if (busy.value) { return; }
  resetErrors();
  if (!form.name.trim()) {
    errors.name = { field: 'name', code: 'required' };
    return;
  }
  if (!form.scopes.length) {
    errors.scopes = { field: 'scopes', code: 'required' };
    return;
  }

  busy.value = true;
  try {
    const { data } = await $http.post<{ token: string; accessToken: AccessToken }>('/api/access-tokens', {
      name: form.name,
      // Keep the canonical order, whatever order the boxes were ticked in.
      scopes: ACCESS_TOKEN_SCOPES.filter(scope => form.scopes.includes(scope)),
      expiresInDays: form.expiresInDays,
    });
    createdToken.value = data.token;
    copied.value = false;
    tokens.value = [data.accessToken, ...tokens.value];
    form.name = '';
    form.scopes = [];
    form.expiresInDays = DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS;
  }
  catch (err) {
    Object.assign(errors, mapFormErrors(err instanceof ApiError ? err : new UnknownApiError()));
  }
  finally {
    busy.value = false;
  }
}

function selectAll(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(createdToken.value);
    copied.value = true;
  }
  catch {
    toastStore.add({ type: 'error', text: t('copy_error') });
  }
}

async function revokeToken(token: AccessToken) {
  if (busy.value) { return; }
  const confirmed = await dialogStore.confirm({
    title: t('revoke_title'),
    message: t('revoke_confirm', { name: token.name }),
    confirmButtonText: t('revoke'),
    confirmButtonType: 'danger',
    cancelButtonText: t('cancel'),
  });
  if (!confirmed) { return; }

  busy.value = true;
  try {
    await $http.delete(`/api/access-tokens/${token.id}`);
    tokens.value = tokens.value.filter(existing => existing.id !== token.id);
    toastStore.add({ type: 'success', text: t('revoked') });
  }
  catch {
    toastStore.add({ type: 'error', text: t('revoke_error') });
  }
  finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.access-tokens__section {
  margin-top: var(--mbl-space-xl);
}

.access-tokens__token-control {
  flex: 1;
}

.access-tokens__table td {
  vertical-align: top;
}
</style>

<i18n lang="json">
{
  "en": {
    "access_tokens": "Access Tokens",
    "intro": "An access token lets an app, script or AI agent use My Bible Log for you, for example to log what you read, look over your progress, or take and organize notes.",
    "intro_safety": "Give each token only the permissions it needs. Anyone who has a token can do what it allows until it expires or you revoke it, so keep it secret. Never give an app or agent your password.",
    "created_header": "Your new access token",
    "created_body": "Copy this token now and give it to your app or agent. You won't be able to see it again.",
    "copy": "Copy",
    "copied": "Copied",
    "copy_error": "Unable to copy. Select the token and copy it yourself.",
    "done": "Done",
    "create_token": "Create a Token",
    "name": "Name",
    "name_placeholder": "What is this token for? (e.g. Claude)",
    "permissions": "Permissions",
    "scope": {
      "logs_read": "Read my reading log and reading settings",
      "logs_write": "Add, change and delete reading log entries",
      "notes_read": "Read my notes and tags",
      "notes_write": "Write, organize and delete notes and tags",
      "scripture_read": "Read Bible passages"
    },
    "never_allowed": "A token can never change your email, password or settings, delete your account, or create other tokens.",
    "expires_after": "Expires after",
    "days": "{days} days",
    "create_button": "Create Token",
    "your_tokens": "Your Tokens",
    "no_tokens": "You don't have any access tokens.",
    "expires": "Expires",
    "expired": "Expired",
    "last_used": "Last used",
    "never": "Never",
    "revoke": "Revoke",
    "revoke_title": "Revoke access token",
    "revoke_confirm": "Anything using \"{name}\" will immediately lose access to your account.",
    "revoked": "Access token revoked.",
    "revoke_error": "Unable to revoke the token. Please try again later.",
    "load_error": "Unable to load your access tokens. Please try again later.",
    "cancel": "Cancel"
  },
  "de": {
    "access_tokens": "Zugriffstoken",
    "intro": "Mit einem Zugriffstoken kann eine App, ein Skript oder ein KI-Agent My Bible Log für Sie nutzen, zum Beispiel um Ihr Lesen einzutragen, Ihren Fortschritt auszuwerten oder Notizen zu schreiben und zu ordnen.",
    "intro_safety": "Geben Sie jedem Token nur die Berechtigungen, die es braucht. Wer ein Token hat, kann damit tun, was es erlaubt, bis es abläuft oder Sie es widerrufen. Halten Sie es also geheim. Geben Sie einer App oder einem Agenten niemals Ihr Passwort.",
    "created_header": "Ihr neues Zugriffstoken",
    "created_body": "Kopieren Sie dieses Token jetzt und geben Sie es Ihrer App oder Ihrem Agenten. Sie können es später nicht mehr sehen.",
    "copy": "Kopieren",
    "copied": "Kopiert",
    "copy_error": "Kopieren nicht möglich. Markieren Sie das Token und kopieren Sie es selbst.",
    "done": "Fertig",
    "create_token": "Token erstellen",
    "name": "Name",
    "name_placeholder": "Wofür ist dieses Token? (z. B. Claude)",
    "permissions": "Berechtigungen",
    "scope": {
      "logs_read": "Mein Leseprotokoll und meine Leseeinstellungen lesen",
      "logs_write": "Einträge im Leseprotokoll hinzufügen, ändern und löschen",
      "notes_read": "Meine Notizen und Tags lesen",
      "notes_write": "Notizen und Tags schreiben, ordnen und löschen",
      "scripture_read": "Bibelstellen lesen"
    },
    "never_allowed": "Ein Token kann niemals Ihre E-Mail-Adresse, Ihr Passwort oder Ihre Einstellungen ändern, Ihr Konto löschen oder weitere Token erstellen.",
    "expires_after": "Läuft ab nach",
    "days": "{days} Tagen",
    "create_button": "Token erstellen",
    "your_tokens": "Ihre Token",
    "no_tokens": "Sie haben keine Zugriffstoken.",
    "expires": "Läuft ab",
    "expired": "Abgelaufen",
    "last_used": "Zuletzt verwendet",
    "never": "Nie",
    "revoke": "Widerrufen",
    "revoke_title": "Zugriffstoken widerrufen",
    "revoke_confirm": "Alles, was „{name}“ verwendet, verliert sofort den Zugriff auf Ihr Konto.",
    "revoked": "Zugriffstoken widerrufen.",
    "revoke_error": "Das Token konnte nicht widerrufen werden. Bitte versuchen Sie es später erneut.",
    "load_error": "Ihre Zugriffstoken konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
    "cancel": "Abbrechen"
  },
  "es": {
    "access_tokens": "Tokens de acceso",
    "intro": "Un token de acceso permite que una aplicación, un script o un agente de IA use My Bible Log por usted, por ejemplo para registrar lo que lee, revisar su progreso o escribir y organizar notas.",
    "intro_safety": "Dé a cada token solo los permisos que necesita. Quien tenga un token puede hacer lo que este permite hasta que caduque o usted lo revoque, así que manténgalo en secreto. Nunca le dé su contraseña a una aplicación o a un agente.",
    "created_header": "Su nuevo token de acceso",
    "created_body": "Copie este token ahora y déselo a su aplicación o agente. No podrá volver a verlo.",
    "copy": "Copiar",
    "copied": "Copiado",
    "copy_error": "No se pudo copiar. Seleccione el token y cópielo usted mismo.",
    "done": "Listo",
    "create_token": "Crear un token",
    "name": "Nombre",
    "name_placeholder": "¿Para qué es este token? (p. ej., Claude)",
    "permissions": "Permisos",
    "scope": {
      "logs_read": "Leer mi registro de lectura y mi configuración de lectura",
      "logs_write": "Añadir, cambiar y eliminar entradas del registro de lectura",
      "notes_read": "Leer mis notas y etiquetas",
      "notes_write": "Escribir, organizar y eliminar notas y etiquetas",
      "scripture_read": "Leer pasajes de la Biblia"
    },
    "never_allowed": "Un token nunca puede cambiar su correo electrónico, su contraseña ni su configuración, eliminar su cuenta ni crear otros tokens.",
    "expires_after": "Caduca después de",
    "days": "{days} días",
    "create_button": "Crear token",
    "your_tokens": "Sus tokens",
    "no_tokens": "No tiene ningún token de acceso.",
    "expires": "Caduca",
    "expired": "Caducado",
    "last_used": "Último uso",
    "never": "Nunca",
    "revoke": "Revocar",
    "revoke_title": "Revocar token de acceso",
    "revoke_confirm": "Todo lo que use «{name}» perderá de inmediato el acceso a su cuenta.",
    "revoked": "Token de acceso revocado.",
    "revoke_error": "No se pudo revocar el token. Por favor, inténtelo de nuevo más tarde.",
    "load_error": "No se pudieron cargar sus tokens de acceso. Por favor, inténtelo de nuevo más tarde.",
    "cancel": "Cancelar"
  },
  "fr": {
    "access_tokens": "Jetons d'accès",
    "intro": "Un jeton d'accès permet à une application, un script ou un agent IA d'utiliser My Bible Log pour vous, par exemple pour enregistrer vos lectures, examiner votre progression, ou rédiger et organiser des notes.",
    "intro_safety": "Ne donnez à chaque jeton que les autorisations dont il a besoin. Quiconque possède un jeton peut faire ce qu'il autorise jusqu'à son expiration ou sa révocation, alors gardez-le secret. Ne donnez jamais votre mot de passe à une application ou à un agent.",
    "created_header": "Votre nouveau jeton d'accès",
    "created_body": "Copiez ce jeton maintenant et donnez-le à votre application ou à votre agent. Vous ne pourrez plus le voir ensuite.",
    "copy": "Copier",
    "copied": "Copié",
    "copy_error": "Impossible de copier. Sélectionnez le jeton et copiez-le vous-même.",
    "done": "Terminé",
    "create_token": "Créer un jeton",
    "name": "Nom",
    "name_placeholder": "À quoi sert ce jeton ? (ex. Claude)",
    "permissions": "Autorisations",
    "scope": {
      "logs_read": "Lire mon journal de lecture et mes paramètres de lecture",
      "logs_write": "Ajouter, modifier et supprimer des entrées du journal de lecture",
      "notes_read": "Lire mes notes et mes tags",
      "notes_write": "Rédiger, organiser et supprimer des notes et des tags",
      "scripture_read": "Lire des passages de la Bible"
    },
    "never_allowed": "Un jeton ne peut jamais modifier votre adresse e-mail, votre mot de passe ou vos paramètres, supprimer votre compte ni créer d'autres jetons.",
    "expires_after": "Expire après",
    "days": "{days} jours",
    "create_button": "Créer le jeton",
    "your_tokens": "Vos jetons",
    "no_tokens": "Vous n'avez aucun jeton d'accès.",
    "expires": "Expire",
    "expired": "Expiré",
    "last_used": "Dernière utilisation",
    "never": "Jamais",
    "revoke": "Révoquer",
    "revoke_title": "Révoquer le jeton d'accès",
    "revoke_confirm": "Tout ce qui utilise « {name} » perdra immédiatement l'accès à votre compte.",
    "revoked": "Jeton d'accès révoqué.",
    "revoke_error": "Impossible de révoquer le jeton. Veuillez réessayer plus tard.",
    "load_error": "Impossible de charger vos jetons d'accès. Veuillez réessayer plus tard.",
    "cancel": "Annuler"
  },
  "ko": {
    "access_tokens": "액세스 토큰",
    "intro": "액세스 토큰을 사용하면 앱, 스크립트 또는 AI 에이전트가 사용자를 대신해 My Bible Log를 사용할 수 있습니다. 예를 들어 읽은 내용을 기록하고, 진행 상황을 살펴보고, 노트를 작성하고 정리할 수 있습니다.",
    "intro_safety": "각 토큰에는 필요한 권한만 부여하세요. 토큰을 가진 사람은 토큰이 만료되거나 해지될 때까지 토큰이 허용하는 작업을 할 수 있으니 비밀로 유지하세요. 앱이나 에이전트에게 비밀번호를 절대 알려주지 마세요.",
    "created_header": "새 액세스 토큰",
    "created_body": "지금 이 토큰을 복사해 앱이나 에이전트에 입력하세요. 다시는 볼 수 없습니다.",
    "copy": "복사",
    "copied": "복사됨",
    "copy_error": "복사할 수 없습니다. 토큰을 선택해 직접 복사하세요.",
    "done": "완료",
    "create_token": "토큰 만들기",
    "name": "이름",
    "name_placeholder": "이 토큰의 용도는 무엇인가요? (예: Claude)",
    "permissions": "권한",
    "scope": {
      "logs_read": "읽기 기록 및 읽기 설정 보기",
      "logs_write": "읽기 기록 항목 추가, 변경 및 삭제",
      "notes_read": "노트와 태그 보기",
      "notes_write": "노트와 태그 작성, 정리 및 삭제",
      "scripture_read": "성경 본문 읽기"
    },
    "never_allowed": "토큰으로는 이메일, 비밀번호 또는 설정을 변경하거나, 계정을 삭제하거나, 다른 토큰을 만들 수 없습니다.",
    "expires_after": "만료 기간",
    "days": "{days}일",
    "create_button": "토큰 만들기",
    "your_tokens": "내 토큰",
    "no_tokens": "액세스 토큰이 없습니다.",
    "expires": "만료",
    "expired": "만료됨",
    "last_used": "마지막 사용",
    "never": "사용 안 함",
    "revoke": "해지",
    "revoke_title": "액세스 토큰 해지",
    "revoke_confirm": "\"{name}\"을(를) 사용하는 모든 항목이 즉시 계정에 접근할 수 없게 됩니다.",
    "revoked": "액세스 토큰이 해지되었습니다.",
    "revoke_error": "토큰을 해지할 수 없습니다. 나중에 다시 시도해 주세요.",
    "load_error": "액세스 토큰을 불러올 수 없습니다. 나중에 다시 시도해 주세요.",
    "cancel": "취소"
  },
  "pt": {
    "access_tokens": "Tokens de acesso",
    "intro": "Um token de acesso permite que um aplicativo, script ou agente de IA use o My Bible Log por você, por exemplo para registrar o que você leu, analisar seu progresso ou escrever e organizar anotações.",
    "intro_safety": "Dê a cada token apenas as permissões de que ele precisa. Quem tiver um token pode fazer o que ele permite até que expire ou você o revogue, então mantenha-o em segredo. Nunca dê sua senha a um aplicativo ou agente.",
    "created_header": "Seu novo token de acesso",
    "created_body": "Copie este token agora e entregue-o ao seu aplicativo ou agente. Você não poderá vê-lo novamente.",
    "copy": "Copiar",
    "copied": "Copiado",
    "copy_error": "Não foi possível copiar. Selecione o token e copie-o você mesmo.",
    "done": "Concluído",
    "create_token": "Criar um token",
    "name": "Nome",
    "name_placeholder": "Para que serve este token? (ex.: Claude)",
    "permissions": "Permissões",
    "scope": {
      "logs_read": "Ler meu registro de leitura e minhas configurações de leitura",
      "logs_write": "Adicionar, alterar e excluir entradas do registro de leitura",
      "notes_read": "Ler minhas anotações e tags",
      "notes_write": "Escrever, organizar e excluir anotações e tags",
      "scripture_read": "Ler passagens da Bíblia"
    },
    "never_allowed": "Um token nunca pode alterar seu e-mail, sua senha ou suas configurações, excluir sua conta ou criar outros tokens.",
    "expires_after": "Expira após",
    "days": "{days} dias",
    "create_button": "Criar token",
    "your_tokens": "Seus tokens",
    "no_tokens": "Você não tem nenhum token de acesso.",
    "expires": "Expira",
    "expired": "Expirado",
    "last_used": "Último uso",
    "never": "Nunca",
    "revoke": "Revogar",
    "revoke_title": "Revogar token de acesso",
    "revoke_confirm": "Tudo o que usa \"{name}\" perderá imediatamente o acesso à sua conta.",
    "revoked": "Token de acesso revogado.",
    "revoke_error": "Não foi possível revogar o token. Tente novamente mais tarde.",
    "load_error": "Não foi possível carregar seus tokens de acesso. Tente novamente mais tarde.",
    "cancel": "Cancelar"
  },
  "uk": {
    "access_tokens": "Токени доступу",
    "intro": "Токен доступу дає змогу застосунку, скрипту або ШІ-агенту користуватися My Bible Log від вашого імені, наприклад записувати прочитане, переглядати ваш прогрес або писати й упорядковувати нотатки.",
    "intro_safety": "Надавайте кожному токену лише ті дозволи, які йому потрібні. Будь-хто, хто має токен, може робити те, що він дозволяє, доки термін його дії не мине або ви його не відкличете, тож тримайте його в таємниці. Ніколи не повідомляйте свій пароль застосунку чи агенту.",
    "created_header": "Ваш новий токен доступу",
    "created_body": "Скопіюйте цей токен зараз і передайте його своєму застосунку чи агенту. Ви більше не зможете його побачити.",
    "copy": "Копіювати",
    "copied": "Скопійовано",
    "copy_error": "Не вдалося скопіювати. Виділіть токен і скопіюйте його самостійно.",
    "done": "Готово",
    "create_token": "Створити токен",
    "name": "Назва",
    "name_placeholder": "Для чого цей токен? (наприклад, Claude)",
    "permissions": "Дозволи",
    "scope": {
      "logs_read": "Переглядати мій журнал читання та налаштування читання",
      "logs_write": "Додавати, змінювати й видаляти записи журналу читання",
      "notes_read": "Переглядати мої нотатки та теги",
      "notes_write": "Писати, упорядковувати й видаляти нотатки та теги",
      "scripture_read": "Читати уривки з Біблії"
    },
    "never_allowed": "Токен ніколи не може змінити вашу електронну пошту, пароль чи налаштування, видалити ваш обліковий запис або створити інші токени.",
    "expires_after": "Діє протягом",
    "days": "{days} днів",
    "create_button": "Створити токен",
    "your_tokens": "Ваші токени",
    "no_tokens": "У вас немає токенів доступу.",
    "expires": "Діє до",
    "expired": "Термін дії минув",
    "last_used": "Останнє використання",
    "never": "Ніколи",
    "revoke": "Відкликати",
    "revoke_title": "Відкликати токен доступу",
    "revoke_confirm": "Усе, що використовує «{name}», негайно втратить доступ до вашого облікового запису.",
    "revoked": "Токен доступу відкликано.",
    "revoke_error": "Не вдалося відкликати токен. Спробуйте пізніше.",
    "load_error": "Не вдалося завантажити ваші токени доступу. Спробуйте пізніше.",
    "cancel": "Скасувати"
  }
}
</i18n>
