import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'


/*
  ==================================================
  RENDER PART ORDER
  ==================================================
*/

export function renderWODetailParts(
  parts
) {

  if (
    !Array.isArray(parts) ||
    parts.length === 0
  ) {

    return `

      <section class="wo-detail-card">

        <div class="wo-detail-card-header">

          <div>

            <h2>Part Order</h2>

            <p>
              Daftar part yang dipesan.
            </p>

          </div>

        </div>


        <div class="wo-detail-empty">

          Belum ada part pada Work Order ini.

        </div>

      </section>

    `

  }


  return `

    <section class="wo-detail-card">

      <div class="wo-detail-card-header">

        <div>

          <h2>Part Order</h2>

          <p>
            Daftar part yang dipesan.
          </p>

        </div>

      </div>


      <div class="wo-detail-table-wrapper">

        <table class="wo-detail-table">

          <thead>

            <tr>

              <th>No</th>

              <th>PNO</th>

              <th>Nama Part</th>

              <th>No Order</th>

              <th>Tgl Order</th>

              <th>Qty Order</th>

              <th>ETA</th>

            </tr>

          </thead>


          <tbody>

            ${parts
              .map(
                (part, index) => `

                  <tr>

                    <td>
                      ${index + 1}
                    </td>


                    <td>

                      <strong>
                        ${escapeHTML(
                          part.pno || '-'
                        )}
                      </strong>

                    </td>


                    <td>
                      ${escapeHTML(
                        part.namaPart || '-'
                      )}
                    </td>


                    <td>
                      ${escapeHTML(
                        part.noOrder || '-'
                      )}
                    </td>


                    <td>
                      ${formatDate(
                        part.tglOrder
                      )}
                    </td>


                    <td>
                      ${Number(
                        part.qtyOrder || 0
                      )}
                    </td>


                    <td>
                      ${formatDate(
                        part.eta
                      )}
                    </td>

                  </tr>

                `
              )
              .join('')
            }

          </tbody>

        </table>

      </div>

    </section>

  `

}