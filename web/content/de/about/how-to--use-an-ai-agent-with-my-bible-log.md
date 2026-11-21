---
dateModified: "2026-11-20"
seo:
  title: "KI-Agenten mit My Bible Log nutzen: Anleitung zur API"
  description: "Verbinden Sie einen KI-Agenten oder Ihr eigenes Skript mit der offenen API von My Bible Log, um Bibellesen zu erfassen, Notizen anzulegen und Tags zu verwalten – mit Stellenangaben wie JHN.3.16."
og:
  title: "KI-Agenten mit My Bible Log nutzen: Anleitung zur API"
  description: "Verbinden Sie einen KI-Agenten oder Ihr eigenes Skript mit der offenen API von My Bible Log, um Bibellesen zu erfassen, Notizen anzulegen und Tags zu verwalten – mit Stellenangaben wie JHN.3.16."
---

# KI-Agenten mit My Bible Log nutzen

Alles, was Sie in My Bible Log tun können, ist auch über die offene API verfügbar. Ein KI-Agent oder ein Skript, das ein Agent für Sie schreibt, kann also Ihr Lesen erfassen, Notizen anlegen und Tags für Sie verwalten.

Diese Seite enthält die wenigen Fakten, die ein Agent für den Einstieg braucht. Geben Sie ihm diese Seite und die unten verlinkte API-Referenz.

## API-Referenz

* **OpenAPI-Spezifikation (JSON):** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **Basis-URL:** `https://www.mybiblelog.com/api`

Die meisten Agenten können die OpenAPI-Spezifikation direkt lesen und daraus jeden Endpunkt kennenlernen.

## Bibelstellen mit vertrauten Angaben

Bibelstellen werden als kurze Angaben im Format von YouVersion und Bible.com geschrieben. Ein Agent muss also nie mit den internen Versnummern von My Bible Log arbeiten:

| Bibelstelle | Angabe |
| --- | --- |
| Genesis | `GEN` |
| Psalm 23 | `PSA.23` |
| Genesis 1–3 | `GEN.1-3` |
| Johannes 3,16–18 | `JHN.3.16-18` |
| Genesis 1,1 – 2,3 | `GEN.1.1-2.3` |

Eine Bibelstelle bleibt innerhalb eines Buches. Kapitel- und Versnummern folgen englischen Bibeln wie der NASB, daher hat Maleachi 4 Kapitel (in der Lutherbibel 3).

Antworten enthalten dieselbe Angabe in einem Feld `passage`, zusammen mit den internen Versnummern.

## Anmelden

Jede Anfrage braucht ein Anmelde-Token, das als Header mitgeschickt wird:

```
Authorization: Bearer <token>
```

Ein Token erhalten Sie, indem Sie sich mit E-Mail und Passwort anmelden:

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

Das Token steht in der Antwort unter `data.token` und ist 30 Tage gültig.

* **Mit Google registriert?** Legen Sie zuerst unter **Einstellungen → E-Mail ändern** ein Passwort an.
* **Behalten Sie Ihr Passwort für sich.** Melden Sie sich selbst an und geben Sie dem Agenten nur das Token.
* **Behandeln Sie das Token wie ein Passwort.** Es hat vollen Zugriff auf Ihr Konto, einschließlich dessen Löschung.
* **Um ein Token zu widerrufen,** verwenden Sie **Von allen Sitzungen abmelden** in den Einstellungen oder ändern Sie Ihr Passwort.

## Häufige Aufgaben

| Aufgabe | Anfrage | Body |
| --- | --- | --- |
| Lesen erfassen | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| Ihr Lesen auflisten | `GET /log-entries` | |
| Notiz anlegen | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| Notizen zu einer Stelle finden | `GET /passage-notes?filterPassage=JHN.3` | |
| Tag anlegen | `POST /passage-note-tags` | `{"label": "Gebet", "color": "#3a7bd5"}` |
| Ihre Tags auflisten | `GET /passage-note-tags` | |
| Einstellungen lesen | `GET /settings` | |

Datumsangaben werden als `YYYY-MM-DD` in Ihrer eigenen Zeitzone geschrieben. So erfassen Sie zum Beispiel Johannes 3 als heute gelesen:

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## Tipps für Agenten

* **Validierungsfehler sind konkret.** Eine `400`-Antwort nennt jedes fehlerhafte Feld und den Grund, sodass ein Agent seine Anfrage korrigieren und erneut senden kann.
* **Sichern Sie Ihre Daten vor Massenänderungen.** Laden Sie Ihre Daten unter **Einstellungen → Exportieren** herunter, bevor Sie einen Agenten viele Einträge auf einmal bearbeiten oder löschen lassen.
* **Die Anmeldung ist begrenzt.** Verwenden Sie ein Token wieder, statt sich für jede Anfrage neu anzumelden.
