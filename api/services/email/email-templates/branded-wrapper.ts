const brandName = 'My Bible Log';
const brandLogoCid = 'logo@mybiblelog';

type RenderBrandedWrapperParams = {
  contentHtml: string;
  footerHtml?: string;
  title?: string;
};

const renderHead = ({ title }: { title?: string }) => (`
  <head>
    ${title ? `<title>${title}</title>` : ''}
    <style>
      .gray {
        background: #eee;
      }

      .title-box {
        background: #1f3d7a;
        color: #fff;
      }

      .content-area {
        padding: 15px;
      }

      h1 {
        font-size: 35px;
        margin: 0;
      }

      .brand {
        vertical-align: middle;
        padding-right: 5px;
      }

      .text-centered {
        text-align: center;
      }

      .cta-container {
        margin-top: 3em;
        margin-bottom: 4em;
      }

      .cta-button {
        color: #fff !important;
        background: #3298dc;
        text-align: center;
        text-decoration: none;
        padding: 0.5em 1em;
        white-space: nowrap;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
      }

      .cta-button:hover {
        background: #2793da;
      }

      .log-entry-table {
        border-collapse: collapse;
      }

      .log-entry-table th,
      .log-entry-table td {
        text-align: left;
        border: 0;
      }

      .log-entry-table td {
        border-top: 1px solid #333;
      }
    </style>
  </head>`
);

const renderBody = ({ contentHtml, footerHtml }: { contentHtml: string; footerHtml?: string }) => (`
  <body>
    <table border="0" cellpadding="5" cellspacing="0" width="100%">
      <tbody>
        <tr>
          <td class="gray" colspan="3">&nbsp;</td>
        </tr>
        <tr>
          <td class="gray" width="*"></td>
          <td class="title-box content-area" width="500px">
            <h1>
              <img class="brand" alt="" src="cid:${brandLogoCid}" width="50" height="50">
              ${brandName}
            </h1>
          </td>
          <td class="gray" width="*"></td>
        </tr>
        <tr>
          <td class="gray" width="*"></td>
          <td class="content-area" width="500px">
            ${contentHtml}
          </td>
          <td class="gray"></td>
        </tr>
        <tr>
          <td class="gray" width="*"></td>
          <td class="gray content-area text-centered">
            ${footerHtml ?? ''}
          </td>
          <td class="gray"></td>
        </tr>
      </tbody>
    </table>
  </body>`
);

const renderBrandedEmail = ({ contentHtml, footerHtml, title }: RenderBrandedWrapperParams): string => {
  return (
    `<html>
    ${renderHead({ title })}
    ${renderBody({ contentHtml, footerHtml })}
    </html>`
  );
};

export { brandLogoCid };
export default renderBrandedEmail;
