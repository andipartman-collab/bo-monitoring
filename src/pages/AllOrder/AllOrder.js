import {
  getOrders
} from '../../services/orderService.js'


const PAGE_SIZE = 20


let currentPage = 1

let pageCursors = []

let currentOrders = []


/*
  ==================================================
  RENDER ALL ORDER
  ==================================================
*/

export function renderAllOrder() {

  return `
    <div class="all-order-page">

      <div
        id="all-order-message"
        class="all-order-message"
      ></div>


      <div class="all-order-card">

        <div
          id="all-order-loading"
          class="all-order-loading"
        >
          Memuat data...
        </div>


        <div
          id="all-order-table-container"
          class="all-order-table-container"
        ></div>


        <div
          id="all-order-pagination"
          class="all-order-pagination"
        ></div>

      </div>

    </div>
  `
}


/*
  ==================================================
  INIT ALL ORDER
  ==================================================
*/

export async function initAllOrder() {

  currentPage = 1

  pageCursors = []

  currentOrders = []


  await loadPage()

}


/*
  ==================================================
  LOAD PAGE
  ==================================================
*/

async function loadPage() {

  showLoading()


  try {

    let cursor = null


    /*
      Halaman 1 tidak menggunakan cursor.

      Halaman berikutnya menggunakan
      cursor dari halaman sebelumnya.
    */

    if (currentPage > 1) {

      cursor =
        pageCursors[
          currentPage - 2
        ]

    }


    const result =
      await getOrders(
        cursor,
        PAGE_SIZE
      )


    currentOrders =
      result.orders


    /*
      Simpan cursor halaman ini.

      Cursor digunakan untuk menuju
      halaman berikutnya.
    */

    if (result.lastDoc) {

      pageCursors[
        currentPage - 1
      ] =
        result.lastDoc

    }


    renderTable(
      currentOrders
    )


    renderPagination(
      result.hasNextPage
    )

  }
  catch (error) {

    console.error(
      'GAGAL MEMUAT ALL ORDER:',
      error
    )


    showError(
      error.message ||
      'Gagal memuat data order.'
    )

  }

}


/*
  ==================================================
  RENDER TABLE
  ==================================================
*/

function renderTable(
  orders
) {

  /*
    Ambil elemen loading.
  */

  const loading =
    document.getElementById(
      'all-order-loading'
    )


  /*
    Ambil container tabel.
  */

  const container =
    document.getElementById(
      'all-order-table-container'
    )


  /*
    Data sudah berhasil diterima,
    jadi loading harus disembunyikan.
  */

  if (loading) {

    loading.style.display =
      'none'

  }


  if (!container) {
    return
  }


  /*
    ========================================
    TIDAK ADA DATA
    ========================================
  */

  if (orders.length === 0) {

    container.innerHTML = `
      <div class="all-order-empty">

        <div class="all-order-empty-icon">
          ▤
        </div>

        <h3>
          Belum ada data order
        </h3>

        <p>
          Belum terdapat Work Order
          di database.
        </p>

      </div>
    `

    return

  }


  /*
    ========================================
    TAMPILKAN TABLE
    ========================================
  */

  container.innerHTML = `

    <div class="all-order-table-wrapper">

      <table class="all-order-table">

        <thead>

          <tr>

            <th>No</th>

            <th>No WO</th>

            <th>SA</th>

            <th>Customer</th>

            <th>No Polisi</th>

            <th>Model</th>

            <th>Tgl Booking</th>

            <th>Dibuat</th>

            <th>Aksi</th>

          </tr>

        </thead>


        <tbody>

          ${orders
            .map(
              (order, index) => {

                const number =
                  (
                    (
                      currentPage - 1
                    ) *
                    PAGE_SIZE
                  ) +
                  index +
                  1


                return `

                  <tr>

                    <td>
                      ${number}
                    </td>


                    <td>

                      <strong>
                        ${escapeHTML(
                          order.noWo ||
                          '-'
                        )}
                      </strong>

                    </td>


                    <td>
                      ${escapeHTML(
                        order.sa ||
                        '-'
                      )}
                    </td>


                    <td>
                      ${escapeHTML(
                        order.customer ||
                        '-'
                      )}
                    </td>


                    <td>
                      ${escapeHTML(
                        order.noPolisi ||
                        '-'
                      )}
                    </td>


                    <td>
                      ${escapeHTML(
                        order.model ||
                        '-'
                      )}
                    </td>


                    <td>
                      ${formatDate(
                        order.tanggalBooking
                      )}
                    </td>


                    <td>
                      ${formatTimestamp(
                        order.createdAt
                      )}
                    </td>


                    <td>

                      <button
                        type="button"
                        class="all-order-detail-button"
                        data-order-id="${escapeHTML(
                          order.id
                        )}"
                      >
                        Detail
                      </button>

                    </td>

                  </tr>

                `

              }
            )
            .join('')
          }

        </tbody>

      </table>

    </div>

  `


  /*
    Aktifkan tombol Detail.
  */

  initDetailButtons()

}


/*
  ==================================================
  PAGINATION
  ==================================================
*/

function renderPagination(
  hasNextPage
) {

  const pagination =
    document.getElementById(
      'all-order-pagination'
    )


  if (!pagination) {
    return
  }


  const canGoPrevious =
    currentPage > 1


  pagination.innerHTML = `

    <div class="pagination-info">

      Halaman
      <strong>
        ${currentPage}
      </strong>

    </div>


    <div class="pagination-buttons">

      <button
        type="button"
        id="all-order-prev"
        class="pagination-button"
        ${canGoPrevious
          ? ''
          : 'disabled'
        }
      >
        ← Sebelumnya
      </button>


      <button
        type="button"
        id="all-order-next"
        class="pagination-button"
        ${hasNextPage
          ? ''
          : 'disabled'
        }
      >
        Berikutnya →
      </button>

    </div>

  `


  const previousButton =
    document.getElementById(
      'all-order-prev'
    )


  const nextButton =
    document.getElementById(
      'all-order-next'
    )


  if (previousButton) {

    previousButton.addEventListener(
      'click',
      goPrevious
    )

  }


  if (nextButton) {

    nextButton.addEventListener(
      'click',
      goNext
    )

  }

}


/*
  ==================================================
  NEXT PAGE
  ==================================================
*/

async function goNext() {

  if (
    currentPage >=
    pageCursors.length + 1
  ) {

    return

  }


  currentPage++

  await loadPage()

}


/*
  ==================================================
  PREVIOUS PAGE
  ==================================================
*/

async function goPrevious() {

  if (currentPage <= 1) {
    return
  }


  currentPage--

  await loadPage()

}


/*
  ==================================================
  DETAIL BUTTON
  ==================================================
*/

function initDetailButtons() {

  const buttons =
    document.querySelectorAll(
      '.all-order-detail-button'
    )


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          const orderId =
            button.dataset.orderId


          if (!orderId) {

            console.error(
              'Order ID tidak tersedia.'
            )

            return

          }


          console.log(
            'BUKA WO DETAIL:',
            orderId
          )


          document.dispatchEvent(
            new CustomEvent(
              'open-wo-detail',
              {
                detail: {
                  orderId
                }
              }
            )
          )

        }
      )

    }
  )

}


/*
  ==================================================
  LOADING
  ==================================================
*/

function showLoading() {

  const loading =
    document.getElementById(
      'all-order-loading'
    )

  const container =
    document.getElementById(
      'all-order-table-container'
    )

  const pagination =
    document.getElementById(
      'all-order-pagination'
    )

  const message =
    document.getElementById(
      'all-order-message'
    )

  if (loading) {

    loading.style.display =
      'block'

    loading.textContent =
      'Memuat data...'

  }

  if (container) {

    container.innerHTML =
      ''

  }

  if (pagination) {

    pagination.innerHTML =
      ''

  }

  if (message) {

    message.className =
      'all-order-message'

    message.textContent =
      ''

  }

}


/*
  ==================================================
  ERROR
  ==================================================
*/

function showError(
  messageText
) {

  const loading =
    document.getElementById(
      'all-order-loading'
    )

  const message =
    document.getElementById(
      'all-order-message'
    )

  if (loading) {

    loading.style.display =
      'none'

  }

  if (message) {

    message.className =
      'all-order-message error'

    message.textContent =
      messageText

  }

}


/*
  ==================================================
  FORMAT DATE
  ==================================================
*/

function formatDate(
  dateString
) {

  if (!dateString) {
    return '-'
  }

  const parts =
    dateString.split('-')

  if (parts.length !== 3) {
    return dateString
  }

  const [
    year,
    month,
    day
  ] = parts

  return `${day}/${month}/${year}`

}


/*
  ==================================================
  FORMAT FIRESTORE TIMESTAMP
  ==================================================
*/

function formatTimestamp(
  timestamp
) {

  if (!timestamp) {
    return '-'
  }

  if (
    timestamp.toDate
  ) {

    return formatDateTime(
      timestamp.toDate()
    )

  }

  return '-'

}


/*
  ==================================================
  FORMAT DATE TIME
  ==================================================
*/

function formatDateTime(
  date
) {

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const year =
    date.getFullYear()

  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      '0'
    )

  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      '0'
    )

  return `${day}/${month}/${year} ${hours}:${minutes}`

}


/*
  ==================================================
  ESCAPE HTML
  ==================================================
*/

function escapeHTML(
  value
) {

  return String(value)
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    )

}