<template>
  <action-menu :actions="actions" />
</template>

<script setup lang="ts">
import type { ReadingGoal } from '@mybiblelog/shared';
import ActionMenu from '~/components/ui/ActionMenu.vue';
import { useDialogStore } from '~/stores/dialog';
import { useReadingGoalsStore } from '~/stores/reading-goals';
import { useToastStore } from '~/stores/toast';

const props = defineProps<{
  goal: ReadingGoal;
}>();

const emit = defineEmits<{
  deleted: [];
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const readingGoalsStore = useReadingGoalsStore();
const dialogStore = useDialogStore();
const toastStore = useToastStore();

const setActive = async (active: boolean) => {
  try {
    await readingGoalsStore.setGoalActive(props.goal, active);
    toastStore.add({ type: 'success', text: t(active ? 'restored' : 'archived') });
  }
  catch {
    toastStore.add({ type: 'error', text: t('save_error') });
  }
};

const deleteGoal = async () => {
  const confirmed = await dialogStore.confirm({
    message: t('confirm_delete', { title: props.goal.title }),
    confirmButtonText: t('delete'),
    confirmButtonType: 'danger',
  });
  if (!confirmed) { return; }
  try {
    await readingGoalsStore.deleteGoal(props.goal.id);
    emit('deleted');
  }
  catch {
    toastStore.add({ type: 'error', text: t('delete_error') });
  }
};

const actions = computed(() => [
  { label: t('edit'), callback: () => navigateTo(localePath({ name: 'goals-id-edit', params: { id: props.goal.id } })) },
  props.goal.active
    ? { label: t('archive'), callback: () => setActive(false) }
    : { label: t('restore'), callback: () => setActive(true) },
  { label: t('delete'), callback: deleteGoal },
]);
</script>

<i18n lang="json">
{
  "en": {
    "edit": "Edit",
    "archive": "Archive",
    "restore": "Restore",
    "delete": "Delete",
    "archived": "Goal archived. It no longer shows on Today.",
    "restored": "Goal restored.",
    "save_error": "The goal could not be saved. Please try again.",
    "delete_error": "The goal could not be deleted.",
    "confirm_delete": "Delete the goal \"{title}\"? Your reading log is not affected. This cannot be undone."
  },
  "de": {
    "edit": "Bearbeiten",
    "archive": "Archivieren",
    "restore": "Wiederherstellen",
    "delete": "Löschen",
    "archived": "Ziel archiviert. Es erscheint nicht mehr unter Heute.",
    "restored": "Ziel wiederhergestellt.",
    "save_error": "Das Ziel konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    "delete_error": "Das Ziel konnte nicht gelöscht werden.",
    "confirm_delete": "Das Ziel „{title}“ löschen? Ihr Leseprotokoll bleibt unverändert. Dies kann nicht rückgängig gemacht werden."
  },
  "es": {
    "edit": "Editar",
    "archive": "Archivar",
    "restore": "Restaurar",
    "delete": "Eliminar",
    "archived": "Meta archivada. Ya no aparece en Hoy.",
    "restored": "Meta restaurada.",
    "save_error": "No se pudo guardar la meta. Inténtalo de nuevo.",
    "delete_error": "No se pudo eliminar la meta.",
    "confirm_delete": "¿Eliminar la meta «{title}»? Tu registro de lectura no se verá afectado. Esta acción no se puede deshacer."
  },
  "fr": {
    "edit": "Modifier",
    "archive": "Archiver",
    "restore": "Restaurer",
    "delete": "Supprimer",
    "archived": "Objectif archivé. Il n'apparaît plus dans Aujourd'hui.",
    "restored": "Objectif restauré.",
    "save_error": "L'objectif n'a pas pu être enregistré. Veuillez réessayer.",
    "delete_error": "L'objectif n'a pas pu être supprimé.",
    "confirm_delete": "Supprimer l'objectif « {title} » ? Votre journal de lecture n'est pas modifié. Cette action est irréversible."
  },
  "ko": {
    "edit": "편집",
    "archive": "보관",
    "restore": "복원",
    "delete": "삭제",
    "archived": "목표를 보관했습니다. 오늘 페이지에 더 이상 표시되지 않습니다.",
    "restored": "목표를 복원했습니다.",
    "save_error": "목표를 저장하지 못했습니다. 다시 시도해 주세요.",
    "delete_error": "목표를 삭제하지 못했습니다.",
    "confirm_delete": "\"{title}\" 목표를 삭제할까요? 읽기 기록은 그대로 유지됩니다. 이 작업은 되돌릴 수 없습니다."
  },
  "pt": {
    "edit": "Editar",
    "archive": "Arquivar",
    "restore": "Restaurar",
    "delete": "Excluir",
    "archived": "Meta arquivada. Ela não aparece mais em Hoje.",
    "restored": "Meta restaurada.",
    "save_error": "Não foi possível salvar a meta. Tente novamente.",
    "delete_error": "Não foi possível excluir a meta.",
    "confirm_delete": "Excluir a meta \"{title}\"? Seu registro de leitura não é afetado. Esta ação não pode ser desfeita."
  },
  "uk": {
    "edit": "Редагувати",
    "archive": "Архівувати",
    "restore": "Відновити",
    "delete": "Видалити",
    "archived": "Мету заархівовано. Вона більше не показується на сторінці «Сьогодні».",
    "restored": "Мету відновлено.",
    "save_error": "Не вдалося зберегти мету. Спробуйте ще раз.",
    "delete_error": "Не вдалося видалити мету.",
    "confirm_delete": "Видалити мету «{title}»? Ваш журнал читання не зміниться. Цю дію не можна скасувати."
  }
}
</i18n>
