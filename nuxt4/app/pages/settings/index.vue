<template>
  <div>
      <h1 class="mbl-title mbl-title--4">
        {{ t('account') }}
      </h1>
      <div class="mbl-content">
        <p>
          <em>{{ authStore.user?.email }}</em>
        </p>
        <p>
          <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/email')">
            {{ t('change_email') }}
          </NuxtLink>
        </p>
      </div>
      <template v-if="authStore.user?.hasLocalAccount">
        <h2 class="mbl-title mbl-title--4">
          {{ t('password') }}
        </h2>
        <div class="mbl-content">
          <p>{{ t('you_can_change_your_password_below') }}</p>
          <p>
            <NuxtLink class="mbl-button mbl-button--primary" :to="localePath('/settings/password')">
              {{ t('change_password') }}
            </NuxtLink>
          </p>
        </div>
      </template>
      <h2 class="mbl-title mbl-title--4">
        {{ t('delete_account') }}
      </h2>
      <div class="mbl-content">
        <p>{{ t('you_are_in_control') }}</p>
        <p>
          <NuxtLink :to="localePath('/settings/delete-account')">
            {{ t('learn_more') }}
          </NuxtLink>
        </p>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const { t } = useI18n();
const localePath = useLocalePath();
const authStore = useAuthStore();
</script>

<i18n lang="json">
{
  "en": {
    "account": "Account",
    "change_email": "Change Email",
    "password": "Password",
    "you_can_change_your_password_below": "You can change your password below.",
    "change_password": "Change Password",
    "delete_account": "Delete Account",
    "you_are_in_control": "You are in control of your data. You can delete your account and all data associated with it.",
    "learn_more": "Learn More"
  },
  "de": {
    "account": "Konto",
    "change_email": "E-Mail ändern",
    "password": "Passwort",
    "you_can_change_your_password_below": "Sie können Ihr Passwort unten ändern.",
    "change_password": "Passwort ändern",
    "delete_account": "Konto löschen",
    "you_are_in_control": "Sie haben die Kontrolle über Ihre Daten. Sie können Ihr Konto und alle mit ihm verbundenen Daten löschen.",
    "learn_more": "Mehr erfahren"
  },
  "es": {
    "account": "Cuenta",
    "change_email": "Cambiar correo electrónico",
    "password": "Contraseña",
    "you_can_change_your_password_below": "Puede cambiar su contraseña a continuación.",
    "change_password": "Cambiar contraseña",
    "delete_account": "Eliminar cuenta",
    "you_are_in_control": "Usted tiene el control de sus datos. Puede eliminar su cuenta y todos los datos asociados a ella.",
    "learn_more": "Aprende más"
  },
  "fr": {
    "account": "Compte",
    "change_email": "Changer Email",
    "password": "Mot de passe",
    "you_can_change_your_password_below": "Vous pouvez changer votre mot de passe ci-dessous.",
    "change_password": "Changer Mot de passe",
    "delete_account": "Supprimer Compte",
    "you_are_in_control": "Vous êtes en contrôle de vos données. Vous pouvez supprimer votre compte et toutes les données qui y sont associées.",
    "learn_more": "En savoir plus"
  },
  "ko": {
    "account": "계정",
    "change_email": "이메일 변경",
    "password": "비밀번호",
    "you_can_change_your_password_below": "아래에서 비밀번호를 변경할 수 있습니다.",
    "change_password": "비밀번호 변경",
    "delete_account": "계정 삭제",
    "you_are_in_control": "여러분의 데이터는 여러분이 관리할 수 있습니다. 계정 및 모든 관련 데이터를 삭제할 수 있습니다.",
    "learn_more": "자세히 보기"
  },
  "pt": {
    "account": "Conta",
    "change_email": "Alterar Email",
    "password": "Senha",
    "you_can_change_your_password_below": "Você pode alterar sua senha abaixo.",
    "change_password": "Alterar Senha",
    "delete_account": "Excluir Conta",
    "you_are_in_control": "Você está no controle dos seus dados. Você pode excluir sua conta e todos os dados associados a ela.",
    "learn_more": "Saiba Mais"
  },
  "uk": {
    "account": "Обліковий запис",
    "change_email": "Змінити електронну пошту",
    "password": "Пароль",
    "you_can_change_your_password_below": "Ви можете змінити свій пароль нижче.",
    "change_password": "Змінити пароль",
    "delete_account": "Видалити обліковий запис",
    "you_are_in_control": "Ви контролюєте свої дані. Ви можете видалити свій обліковий запис та всі пов'язані з ним дані.",
    "learn_more": "Дізнатися більше"
  }
}
</i18n>
