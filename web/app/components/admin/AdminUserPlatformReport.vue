<template>
  <details class="platform-report mbl-box" @toggle="onToggle">
    <summary class="platform-report__summary">
      {{ t('title') }}
    </summary>

    <p v-if="loadError" class="mbl-text-muted">
      {{ t('error_loading') }}
    </p>
    <p v-else-if="!report" class="mbl-text-muted">
      {{ t('loading') }}
    </p>
    <template v-else>
      <div class="platform-report__meta mbl-text-small mbl-text-muted">
        <span>{{ t('generated', { total: report.totalUsers, when: generatedAgo }) }}</span>
        <button class="mbl-button mbl-button--sm mbl-button--light" type="button" :disabled="loading" @click="load(true)">
          {{ t('refresh') }}
        </button>
      </div>
      <p class="mbl-text-small mbl-text-muted">
        {{ t('hint') }}
      </p>

      <div class="platform-report__grid">
        <div class="mbl-table-wrap">
          <table class="mbl-table mbl-table--narrow mbl-table--full">
            <thead>
              <tr>
                <th>{{ t('column_platform') }}</th>
                <th class="platform-report__num">
                  {{ t('column_users') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="platform in PLATFORMS" :key="platform" class="platform-report__row" @click="apply({ platforms: [platform] })">
                <td>{{ platform }}</td>
                <td class="platform-report__num">
                  {{ report.byPlatform[platform] }}
                </td>
              </tr>
              <tr class="platform-report__row" @click="apply({ platforms: [], platformsExact: true })">
                <td class="mbl-text-muted">
                  {{ t('none_recorded') }}
                </td>
                <td class="platform-report__num">
                  {{ report.noPlatform }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mbl-table-wrap">
          <table class="mbl-table mbl-table--narrow mbl-table--full">
            <thead>
              <tr>
                <th>{{ t('column_locale') }}</th>
                <th class="platform-report__num">
                  {{ t('column_users') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.byLocale" :key="row.locale" class="platform-report__row" @click="apply({ locale: row.locale })">
                <td>{{ localeName(row.locale) }}</td>
                <td class="platform-report__num">
                  {{ row.count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mbl-table-wrap">
        <table class="mbl-table mbl-table--narrow mbl-table--full">
          <thead>
            <tr>
              <th>{{ t('column_combination') }}</th>
              <th class="platform-report__num">
                {{ t('column_users') }}
              </th>
              <th>{{ t('column_signup') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in report.byCombination"
              :key="row.platforms.join('+')"
              class="platform-report__row"
              @click="apply({ platforms: row.platforms, platformsExact: true })"
            >
              <td>{{ row.platforms.length ? row.platforms.join(' + ') : t('none_recorded') }}</td>
              <td class="platform-report__num">
                {{ row.count }}
              </td>
              <td class="platform-report__signup">
                <button
                  v-for="[signup, count] in signupEntries(row.bySignupPlatform)"
                  :key="signup"
                  class="mbl-button mbl-button--sm mbl-button--light"
                  type="button"
                  @click.stop="apply({ platforms: row.platforms, platformsExact: true, signupPlatform: signup })"
                >
                  {{ signup === 'unknown' ? t('signup_unknown') : signup }}: {{ count }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </details>
</template>

<script setup lang="ts">
import { displayTimeSince, locales } from '@mybiblelog/shared';

export type AdminPlatform = 'web' | 'android' | 'ios';
export type SignupPlatform = AdminPlatform | 'unknown';

export interface AdminUserFilter {
  platforms: AdminPlatform[];
  platformsExact: boolean;
  signupPlatform: SignupPlatform | '';
  locale: string;
}

interface PlatformReport {
  generatedAt: string;
  totalUsers: number;
  byLocale: { locale: string; count: number }[];
  byPlatform: Record<AdminPlatform, number>;
  noPlatform: number;
  byCombination: { platforms: AdminPlatform[]; count: number; bySignupPlatform: Partial<Record<SignupPlatform, number>> }[];
}

const PLATFORMS: AdminPlatform[] = ['web', 'android', 'ios'];

const emit = defineEmits<{ (e: 'apply-filter', filter: Partial<AdminUserFilter>): void }>();

const { $http } = useNuxtApp();
const { t, locale } = useI18n();

const report = ref<PlatformReport | null>(null);
const loading = ref(false);
const loadError = ref(false);

const generatedAgo = computed(() => (report.value ? displayTimeSince(report.value.generatedAt, locale.value) : ''));

function localeName(code: string) {
  const match = locales.find((l) => l.code === code);
  return match ? `${match.name} (${code})` : code;
}

function signupEntries(bySignup: Partial<Record<SignupPlatform, number>>) {
  return Object.entries(bySignup).sort((a, b) => b[1] - a[1]) as [SignupPlatform, number][];
}

// The report is fetched only once the panel is opened, so ordinary visits to
// the users page never trigger the (server-cached) whole-collection count.
async function load(refresh = false) {
  loading.value = true;
  loadError.value = false;
  try {
    const { data } = await $http.get<PlatformReport>(`/api/admin/reports/user-platforms${refresh ? '?refresh=true' : ''}`);
    report.value = data;
  }
  catch {
    loadError.value = true;
  }
  finally {
    loading.value = false;
  }
}

function onToggle(event: Event) {
  if ((event.target as HTMLDetailsElement).open && !report.value && !loading.value) {
    load();
  }
}

function apply(filter: Partial<AdminUserFilter>) {
  emit('apply-filter', { platforms: [], platformsExact: false, signupPlatform: '', locale: '', ...filter });
}
</script>

<style scoped>
.platform-report {
  margin-bottom: var(--mbl-space-md);
}

.platform-report__summary {
  cursor: pointer;
  font-weight: 600;
}

.platform-report__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mbl-space-sm);
  margin-top: var(--mbl-space-sm);
}

.platform-report__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--mbl-space-md);
  margin-bottom: var(--mbl-space-md);
}

.platform-report__row {
  cursor: pointer;
}

.platform-report__num {
  text-align: right;
  white-space: nowrap;
}

.platform-report__signup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mbl-space-xs);
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "Platform & locale breakdown",
    "loading": "Loading…",
    "error_loading": "There was an error loading the breakdown.",
    "generated": "{total} users · counted {when}",
    "refresh": "Recount",
    "hint": "Click a row to filter the user list. Platforms are those a user has signed in from since platform tracking began; signup platform is unknown for accounts created before then.",
    "column_platform": "Platform",
    "column_locale": "Locale",
    "column_users": "Users",
    "column_combination": "Exact platform combination",
    "column_signup": "Signed up on",
    "none_recorded": "None recorded",
    "signup_unknown": "unknown"
  },
  "de": {
    "title": "Aufschlüsselung nach Plattform und Sprache",
    "loading": "Wird geladen…",
    "error_loading": "Beim Laden der Aufschlüsselung ist ein Fehler aufgetreten.",
    "generated": "{total} Benutzer · gezählt {when}",
    "refresh": "Neu zählen",
    "hint": "Klicke auf eine Zeile, um die Benutzerliste zu filtern. Plattformen sind die, von denen sich ein Benutzer seit Beginn der Plattformerfassung angemeldet hat; die Registrierungsplattform ist für zuvor erstellte Konten unbekannt.",
    "column_platform": "Plattform",
    "column_locale": "Sprache",
    "column_users": "Benutzer",
    "column_combination": "Genaue Plattformkombination",
    "column_signup": "Registriert über",
    "none_recorded": "Keine erfasst",
    "signup_unknown": "unbekannt"
  },
  "es": {
    "title": "Desglose por plataforma e idioma",
    "loading": "Cargando…",
    "error_loading": "Hubo un error al cargar el desglose.",
    "generated": "{total} usuarios · contados {when}",
    "refresh": "Volver a contar",
    "hint": "Haz clic en una fila para filtrar la lista de usuarios. Las plataformas son aquellas desde las que un usuario ha iniciado sesión desde que comenzó el seguimiento de plataformas; la plataforma de registro es desconocida para las cuentas creadas antes.",
    "column_platform": "Plataforma",
    "column_locale": "Idioma",
    "column_users": "Usuarios",
    "column_combination": "Combinación exacta de plataformas",
    "column_signup": "Registrado en",
    "none_recorded": "Ninguna registrada",
    "signup_unknown": "desconocida"
  },
  "fr": {
    "title": "Répartition par plateforme et langue",
    "loading": "Chargement…",
    "error_loading": "Une erreur s'est produite lors du chargement de la répartition.",
    "generated": "{total} utilisateurs · comptés {when}",
    "refresh": "Recompter",
    "hint": "Cliquez sur une ligne pour filtrer la liste des utilisateurs. Les plateformes sont celles depuis lesquelles un utilisateur s'est connecté depuis le début du suivi des plateformes ; la plateforme d'inscription est inconnue pour les comptes créés auparavant.",
    "column_platform": "Plateforme",
    "column_locale": "Langue",
    "column_users": "Utilisateurs",
    "column_combination": "Combinaison exacte de plateformes",
    "column_signup": "Inscrit sur",
    "none_recorded": "Aucune enregistrée",
    "signup_unknown": "inconnue"
  },
  "ko": {
    "title": "플랫폼 및 언어별 분석",
    "loading": "불러오는 중…",
    "error_loading": "분석을 불러오는 중 오류가 발생했습니다.",
    "generated": "사용자 {total}명 · {when} 집계",
    "refresh": "다시 집계",
    "hint": "행을 클릭하면 사용자 목록이 필터링됩니다. 플랫폼은 플랫폼 추적이 시작된 이후 사용자가 로그인한 플랫폼이며, 그 이전에 생성된 계정의 가입 플랫폼은 알 수 없습니다.",
    "column_platform": "플랫폼",
    "column_locale": "언어",
    "column_users": "사용자",
    "column_combination": "정확한 플랫폼 조합",
    "column_signup": "가입 플랫폼",
    "none_recorded": "기록 없음",
    "signup_unknown": "알 수 없음"
  },
  "pt": {
    "title": "Distribuição por plataforma e idioma",
    "loading": "Carregando…",
    "error_loading": "Ocorreu um erro ao carregar a distribuição.",
    "generated": "{total} usuários · contados {when}",
    "refresh": "Recontar",
    "hint": "Clique em uma linha para filtrar a lista de usuários. Plataformas são aquelas em que o usuário entrou desde o início do rastreamento de plataformas; a plataforma de cadastro é desconhecida para contas criadas antes disso.",
    "column_platform": "Plataforma",
    "column_locale": "Idioma",
    "column_users": "Usuários",
    "column_combination": "Combinação exata de plataformas",
    "column_signup": "Cadastrado em",
    "none_recorded": "Nenhuma registrada",
    "signup_unknown": "desconhecida"
  },
  "uk": {
    "title": "Розподіл за платформою та мовою",
    "loading": "Завантаження…",
    "error_loading": "Під час завантаження розподілу сталася помилка.",
    "generated": "{total} користувачів · підраховано {when}",
    "refresh": "Перерахувати",
    "hint": "Натисніть рядок, щоб відфільтрувати список користувачів. Платформи — це ті, з яких користувач входив відтоді, як почалося відстеження платформ; платформа реєстрації невідома для облікових записів, створених раніше.",
    "column_platform": "Платформа",
    "column_locale": "Мова",
    "column_users": "Користувачі",
    "column_combination": "Точна комбінація платформ",
    "column_signup": "Зареєстровано через",
    "none_recorded": "Не зафіксовано",
    "signup_unknown": "невідомо"
  }
}
</i18n>
