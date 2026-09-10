export function getNewOrderData() {

  const noWo =
    document
      .getElementById('noWo')
      ?.value
      .trim()

  const sa =
    document
      .getElementById('sa')
      ?.value
      .trim()

  const customer =
    document
      .getElementById('customer')
      ?.value
      .trim()

  const noPolisi =
    document
      .getElementById('noPolisi')
      ?.value
      .trim()

  const model =
    document
      .getElementById('model')
      ?.value
      .trim()

  const tanggalBooking =
    document
      .getElementById('tanggalBooking')
      ?.value
      .trim()

  const note =
    document
      .getElementById('note')
      ?.value
      .trim()


  const parts =
    getNewOrderParts()


  return {

    noWo,

    sa,

    customer,

    noPolisi,

    model,

    tanggalBooking,

    note,

    parts

  }

}


function getNewOrderParts() {

  const rows =
    document.querySelectorAll(
      '#parts-table-body .part-row'
    )


  return Array.from(rows)
    .map(row => {

      const pno =
        row
          .querySelector('.part-pno')
          ?.value
          .trim()

      const namaPart =
        row
          .querySelector('.part-name')
          ?.value
          .trim()

      const noOrder =
        row
          .querySelector('.part-no-order')
          ?.value
          .trim()

      const tglOrder =
        row
          .querySelector('.part-tgl-order')
          ?.value
          .trim()

      const qtyValue =
        row
          .querySelector('.part-qty')
          ?.value
          .trim()

      const eta =
        row
          .querySelector('.part-eta')
          ?.value
          .trim()


      return {

        pno,

        namaPart,

        noOrder,

        tglOrder,

        qtyOrder:
          Number(qtyValue),

        eta

      }

    })

}