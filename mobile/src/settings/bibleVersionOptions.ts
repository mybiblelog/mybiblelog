import { BibleVersions } from "@mybiblelog/shared";

/**
 * Display names for the translations users can pick as their preferred Bible
 * version. Shared between Settings → Reading and the onboarding wizard's
 * bible step so the two pickers can't drift apart.
 */
export const bibleVersionNames: Record<string, string> = {
  [BibleVersions.NASB2020]: "New American Standard Bible (NASB)",
  [BibleVersions.NASB1995]: "New American Standard Bible 1995 (NASB 1995)",
  [BibleVersions.AMP]: "Amplified Bible (AMP)",
  [BibleVersions.KJV]: "King James Version (KJV)",
  [BibleVersions.NKJV]: "New King James Version (NKJV)",
  [BibleVersions.NIV]: "New International Version (NIV)",
  [BibleVersions.ESV]: "English Standard Version (ESV)",
  [BibleVersions.NABRE]: "New American Bible Revised Edition (NABRE)",
  [BibleVersions.NLT]: "New Living Translation (NLT)",
  [BibleVersions.TPT]: "The Passion Translation (TPT)",
  [BibleVersions.MSG]: "The Message (MSG)",
  [BibleVersions.RVR1960]: "Reina-Valera 1960 (RVR1960)",
  [BibleVersions.RVR2020]: "Reina-Valera 2020 (RVR2020)",
  [BibleVersions.UKR]: "українська (UKRK)",
  [BibleVersions.BDS]: "Bible du Semeur (BDS)",
  [BibleVersions.LSG]: "Louis Segond (LSG)",
  [BibleVersions.ARC]: "Almeida Revista e Corrigida (ARC)",
  [BibleVersions.LUT]: "Luther 1545 (LUT)",
};

export const bibleVersionOptions: { value: string; label: string }[] = Object.keys(
  bibleVersionNames
).map((value) => ({ value, label: bibleVersionNames[value] as string }));
