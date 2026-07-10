---
seo:
  title: Página de Configurações
  description: Documentação para configurações de leitura, relatório e conta do My Bible Log
og:
  title: Página de Configurações
  description: Documentação para configurações de leitura, relatório e conta do My Bible Log
---

![](/share.jpg)

# Página de Configurações

A página de configurações está organizada em vários painéis:

* Conta
* Leitura
* E-mails de Lembrete Diário
* Exportar
* Importar

## Conta

Quando a página de Configurações é aberta pela primeira vez, o painel de Conta será exibido.

Aqui você pode:

* mudar seu endereço de e-mail
* excluir sua conta

## Leitura

O painel de Leitura permite ajustar configurações relacionadas à leitura da Bíblia. Estas incluem sua **Meta Diária de Versículos** e **Data de Revisão**.

### Meta Diária de Versículos

Sua meta diária de versículos é o número de versículos da Bíblia que você deseja ler a cada dia. Esta configuração afeta o comportamento das barras de progresso na página de Hoje e na página do Calendário.

Para ajudá-lo a decidir qual deve ser sua meta diária de versículos, esta seção mostra quantos dias levará para ler a Bíblia se você alcançar sua meta de versículos a cada dia. Por padrão, esse valor é 86, o que permitirá que você leia toda a Bíblia em menos de 365 dias.

### Data de Revisão

Sua data de revisão determina até quando o My Bible Log analisará seu progresso em seu registro de leitura. Sua data de revisão começa na data em que você começou a usar o My Bible Log.

Entradas no registro antes desta data são ignoradas. Como exemplo, a página de Livros da Bíblia não exibirá a leitura que você fez antes de sua data de revisão.

Se você ler toda a Bíblia e quiser recomeçar e ler todos os livros novamente, definir a data de revisão como a data atual limpará seu progresso na página de Livros da Bíblia e permitirá que suas entradas de log sejam consideradas versículos "novos" novamente na página de Hoje e na página do Calendário.

Alterar sua data de revisão não apagará nenhum dado do My Bible Log. Todas as suas entradas de log ainda existem e podem ser visualizadas a qualquer momento na página do Calendário.

### Versão Preferida da Bíblia

Você pode escolher uma tradução que prefere usar para leitura. Links de leitura externos abrirão esta tradução da Bíblia em seu aplicativo de leitura preferido.

Se uma tradução que você deseja usar não estiver listada, por favor solicite-a por meio [deste formulário](/pt/feedback).

### Aplicativo Preferido da Bíblia

Você pode escolher o aplicativo ou site que será aberto ao clicar em um link de leitura.

Essa configuração é armazenada no dispositivo em vez de em sua conta, permitindo que você use diferentes aplicativos ou sites em dispositivos diferentes.

Se um site ou aplicativo que você deseja usar não estiver listado, por favor solicite-o por meio [deste formulário](/pt/feedback).

## E-mails de Lembrete Diário

Você pode optar por receber um lembrete diário por e-mail do My Bible Log. O e-mail chegará em um horário de sua escolha.

### Opt-in

Você deve confirmar que deseja receber um e-mail de lembrete diário. O My Bible Log não envia e-mails não solicitados.

Você pode desativar os e-mails de lembrete de suas configurações a qualquer momento. Cada e-mail também contém um link de cancelamento de inscrição instantâneo.

### Horário do Lembrete

Você deve escolher um horário para receber seu e-mail de lembrete diário. Isso permite que os lembretes sejam uma parte útil e intencional de sua rotina diária.

## Exportar

### Registro de Leitura (CSV)

Seu registro de leitura pode ser exportado como uma planilha (no formato de arquivo CSV). Isso permite que você trabalhe com seus dados da maneira que desejar.

Se você tiver habilidades de programação ou conhece alguém que tenha, poderá usar esses dados para criar novos gráficos e gráficos. Você poderia até mesmo combinar os dados de exportação do My Bible Log de várias pessoas.

Abaixo está um exemplo de como se parece uma planilha de exportação do My Bible Log. Os cabeçalhos "Data" e "Passagem" não aparecerão no arquivo.

|Data|Passagem|
|---|---|
|2020-07-21|Mateus 1-3|
|2020-07-22|Mateus 4-9|
|2020-07-22|Mateus 10-11|
|2020-07-23|Mateus 12-13|
|2020-07-23|Mateus 14-17|
|2020-07-24|Mateus 18-21|
|2020-07-24|Mateus 22-28|

Abaixo está como o arquivo CSV se parece em um editor de texto. Note como uma vírgula aparece entre a data e a passagem, já que este é um arquivo de Valores Separados por Vírgula (CSV).

```csv
2020-07-21,Matheus 1-3
2020-07-22,Matheus 4-9
2020-07-22,Matheus 10-11
2020-07-23,Matheus 12-13
2020-07-23,Matheus 14-17
2020-07-24,Matheus 18-21
2020-07-24,Matheus 22-28
```

### Notas e Etiquetas (Arquivo de Texto)

Você pode exportar suas notas e etiquetas em um arquivo de texto.

Enquanto a exportação do registro de leitura (arquivo CSV) pode ser importada de volta automaticamente para o My Bible Log, a exportação de notas não pode ser importada automaticamente.
No entanto, você sempre pode recriar manualmente notas e etiquetas a partir de seu arquivo de exportação se precisar recuperar seus dados.

## Importar

Você pode importar uma planilha de registro de leitura (no formato de arquivo CSV) para o My Bible Log. Você pode importar uma planilha criada por você mesmo, ou importar uma planilha que você exportou anteriormente do My Bible Log.

O recurso de importação de registro de leitura usa o mesmo formato de arquivo que o recurso de exportação de registro de leitura.

Ao importar uma planilha, o progresso da importação será exibido na página. O My Bible Log não recriará entradas de registro que já existem. Se você leu Gênesis 1 em 1 de janeiro e rastreou no My Bible Log, e depois importou uma planilha que incluía uma entrada de log para aquela mesma passagem e data, o My Bible Log a ignoraria.

<div class="mbl-button-group">
  <a class="mbl-button mbl-button--light" href="/pt/settings">Ir para página de Configurações</a>
</div>
