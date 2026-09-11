import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'

export function renderWODetailInfo(
  order,
  statusInfo = {},
  options = {}
) {
  const status =
    statusInfo.status || 'ON ORDER'

  const readOnly =
    Boolean(options.readOnly)

  const showFinishButton =
    status === 'BOOKING' && !readOnly

  return `
    <section class="wo-detail-card">
      <div class="wo-detail-card-header">
        <div>
          <h2>Informasi Work Order</h2>
          <p>
            Informasi utama Work Order.
          </p>
        </div>

        <div class="wo-detail-card-header-actions">
          ${showFinishButton ? `
            <button
              type="button"
              id="wo-finish-button"
              class="wo-detail-finish-button"
            >
              ✓ Finish Order
            </button>
          ` : ''}

          ${readOnly ? '' : `
            <button
              type="button"
              id="wo-edit-button"
              class="wo-detail-edit-button"
            >
              ✏ Edit WO
            </button>

            <button
              type="button"
              id="wo-delete-button"
              class="wo-detail-delete-button"
            >
              🗑 Hapus WO
            </button>
          `}
        </div>
      </div>

      <div class="wo-detail-info-grid">
        <div class="wo-detail-info-item">
          <span>No WO</span>
          <strong>${escapeHTML(order.noWo || '-')}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>SA</span>
          <strong>${escapeHTML(order.sa || '-')}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>Customer</span>
          <strong>${escapeHTML(order.customer || '-')}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>No Polisi</span>
          <strong>${escapeHTML(order.noPolisi || '-')}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>Model</span>
          <strong>${escapeHTML(order.model || '-')}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>Tgl Booking</span>
          <strong>${formatDate(order.tanggalBooking)}</strong>
        </div>

        <div class="wo-detail-info-item">
          <span>Status WO</span>
          <strong class="wo-status-badge ${status.toLowerCase().replace(' ', '-')}">
            ${escapeHTML(status)}
          </strong>
        </div>

        <div class="wo-detail-info-item wo-detail-info-note">
          <span>Note</span>
          <strong>${escapeHTML(order.note || '-')}</strong>
        </div>
      </div>
    </section>
  `
}
