import 'pinia';
import type { HttpClient, Translator } from '@mybiblelog/shared';

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $http: HttpClient;
    $i18n: Translator;
  }
}
