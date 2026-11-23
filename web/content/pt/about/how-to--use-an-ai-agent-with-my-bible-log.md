---
dateModified: "2026-11-20"
seo:
  title: "Use um agente de IA com o My Bible Log: guia da API"
  description: "Conecte um agente de IA ou seu próprio script à API aberta do My Bible Log para registrar sua leitura bíblica, fazer anotações e organizar tags, usando referências como JHN.3.16."
og:
  title: "Use um agente de IA com o My Bible Log: guia da API"
  description: "Conecte um agente de IA ou seu próprio script à API aberta do My Bible Log para registrar sua leitura bíblica, fazer anotações e organizar tags, usando referências como JHN.3.16."
---

# Use um agente de IA com o My Bible Log

Tudo o que você pode fazer no My Bible Log está disponível pela API aberta. Isso significa que um agente de IA, ou um script que um agente ajude você a escrever, pode registrar sua leitura, fazer anotações e gerenciar tags por você.

Esta página traz as poucas informações de que um agente precisa para começar. Passe para ele esta página e a referência da API abaixo.

## Referência da API

* **Especificação OpenAPI (JSON):** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **URL base:** `https://www.mybiblelog.com/api`

A maioria dos agentes consegue ler a especificação OpenAPI diretamente e aprender cada endpoint a partir dela.

## Passagens usam referências conhecidas

As passagens são escritas como referências curtas no formato usado pelo YouVersion e pelo Bible.com, então um agente nunca precisa lidar com os números de versículo internos do My Bible Log:

| Passagem | Referência |
| --- | --- |
| Gênesis | `GEN` |
| Salmo 23 | `PSA.23` |
| Gênesis 1-3 | `GEN.1-3` |
| João 3:16-18 | `JHN.3.16-18` |
| Gênesis 1:1 - 2:3 | `GEN.1.1-2.3` |

Uma passagem fica dentro de um único livro. Os números de capítulo e versículo seguem Bíblias em inglês como a NASB, por isso Malaquias tem 4 capítulos.

As respostas incluem a mesma referência em um campo `passage`, junto com os números de versículo internos.

## Entrar na conta

Toda solicitação precisa de um token de acesso, enviado como cabeçalho:

```
Authorization: Bearer <token>
```

Obtenha um token entrando com seu e-mail e senha:

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

O token fica em `data.token` na resposta e dura 30 dias.

* **Cadastrou-se com o Google?** Crie primeiro uma senha em **Configurações → Alterar Email**.
* **Não compartilhe sua senha.** Entre você mesmo e passe ao agente apenas o token.
* **Trate o token como uma senha.** Ele tem acesso total à sua conta, inclusive para excluí-la.
* **Para revogar um token,** use **Encerrar todas as sessões** nas Configurações ou altere sua senha.

## Tarefas comuns

| Tarefa | Solicitação | Corpo |
| --- | --- | --- |
| Registrar uma leitura | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| Listar sua leitura | `GET /log-entries` | |
| Criar uma anotação | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| Encontrar anotações de uma passagem | `GET /passage-notes?filterPassage=JHN.3` | |
| Criar uma tag | `POST /passage-note-tags` | `{"label": "Oração", "color": "#3a7bd5"}` |
| Listar suas tags | `GET /passage-note-tags` | |
| Ler suas configurações | `GET /settings` | |

As datas são escritas como `YYYY-MM-DD`, no seu próprio fuso horário. Por exemplo, para registrar João 3 como lido hoje:

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## Dicas para agentes

* **Os erros de validação são específicos.** Uma resposta `400` lista cada campo que falhou e o motivo, para que o agente possa corrigir a solicitação e tentar de novo.
* **Faça backup antes de alterações em massa.** Baixe seus dados em **Configurações → Exportar** antes de deixar um agente editar ou excluir muitos itens de uma vez.
* **O login tem limite de frequência.** Reutilize um token em vez de entrar a cada solicitação.
