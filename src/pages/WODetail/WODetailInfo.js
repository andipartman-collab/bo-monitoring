import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'


/*
  ==================================================
  RENDER WO INFO
  ==================================================
*/

export function renderWODetailInfo(
  order
) {

  return `

    <section class="wo-detail-card">

      <div class="wo-detail-card-header">

        <div>

          <h2>Informasi Work Order</h2>

          <p>
            Informasi utama Work Order.
          </p>

        </div>

        <button
          type="button"
          id="wo-edit-button"
          class="wo-detail-edit-button"
        >
          ✏ Edit WO
        </button>

      </div>


      <div class="wo-detail-info-grid">

        <div class="wo-detail-info-item">

          <span>No WO</span>

          <strong>
            ${escapeHTML(
              order.noWo || '-'
            )}
          </strong>

        </div>


        <div class="wo-detail-info-item">

          <span>SA</span>

          <strong>
            ${escapeHTML(
              order.sa || '-'
            )}
          </strong>

        </div>


        <div class="wo-detail-info-item">

          <span>Customer</span>

          <strong>
            ${escapeHTML(
              order.customer || '-'
            )
          }</strong>

        </div>


        <div class="wo-detail-info-item">

          <span>No Polisi</span>

          <strong>
            ${escapeHTML(
              order.noPolisi || '-'
            )}
          </strong>

        </div>


        <div class="wo-detail-info-item">

          <span>Model</span>

          <strong>
            ${escapeHTML(
              order.model || '-'
            )}
          </strong>

        </div>


        <div class="wo-detail-info-item">

          <span>Tgl Booking</span>

          <strong>
            ${formatDate(
              order.tanggalBooking
            )}
          </strong>

        </div>


        <div class="wo-detail-info-item wo-detail-info-note">

          <span>Note</span>

          <strong>
            ${escapeHTML(
              order.note || '-'
            )}
          </strong>

        </div>

      </div>

    </section>

  `
}