export function validateNewOrder() {

  const errors = []

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

  /*
    ==========================
    VALIDASI INFORMASI WO
    ==========================
  */

  if (!noWo) {

    errors.push({
      field: 'noWo',
      message: 'No WO wajib diisi.'
    })

  }

  if (!sa) {

    errors.push({
      field: 'sa',
      message: 'SA wajib dipilih.'
    })

  }

  if (!customer) {

    errors.push({
      field: 'customer',
      message: 'Customer wajib diisi.'
    })

  }

  if (!noPolisi) {

    errors.push({
      field: 'noPolisi',
      message: 'No Polisi wajib diisi.'
    })

  }

  if (!model) {

    errors.push({
      field: 'model',
      message: 'Model wajib diisi.'
    })

  }


  /*
    ==========================
    VALIDASI PART
    ==========================
  */

  const rows =
    document.querySelectorAll(
      '#parts-table-body .part-row'
    )

  if (rows.length === 0) {

    errors.push({
      field: 'parts',
      message: 'Minimal tambahkan 1 part.'
    })

  }


  rows.forEach(
    (row, index) => {

      const partNumber =
        index + 1

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


      if (!pno) {

        errors.push({
          field: 'part-pno',
          row,
          message:
            `PNO pada Part ${partNumber} wajib diisi.`
        })

      }


      if (!namaPart) {

        errors.push({
          field: 'part-name',
          row,
          message:
            `Nama Part pada Part ${partNumber} wajib diisi.`
        })

      }


      if (!noOrder) {

        errors.push({
          field: 'part-no-order',
          row,
          message:
            `No Order pada Part ${partNumber} wajib diisi.`
        })

      }


      if (!tglOrder) {

        errors.push({
          field: 'part-tgl-order',
          row,
          message:
            `Tgl Order pada Part ${partNumber} wajib diisi.`
        })

      }


      if (!qtyValue) {

        errors.push({
          field: 'part-qty',
          row,
          message:
            `Qty pada Part ${partNumber} wajib diisi.`
        })

      }
      else {

        const qty =
          Number(qtyValue)

        if (
          !Number.isInteger(qty) ||
          qty < 1
        ) {

          errors.push({
            field: 'part-qty',
            row,
            message:
              `Qty pada Part ${partNumber} harus berupa angka minimal 1.`
          })

        }

      }

    }
  )


  /*
    ==========================
    HASIL VALIDASI
    ==========================
  */

  if (errors.length > 0) {

    return {
      valid: false,
      errors
    }

  }


  return {
    valid: true,
    errors: []
  }

}