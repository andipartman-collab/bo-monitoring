export function initUppercaseInputs() {

  const uppercaseFields = [
    'noWo',
    'customer',
    'noPolisi',
    'model',
    'note'
  ]


  uppercaseFields.forEach(id => {

    const input = document.getElementById(id)

    if (!input) {
      return
    }


    input.addEventListener('input', () => {

      const start = input.selectionStart
      const end = input.selectionEnd

      input.value =
        input.value.toUpperCase()

      input.setSelectionRange(
        start,
        end
      )

    })

  })

}


/*
  Mengambil tanggal hari ini
  dalam format YYYY-MM-DD.

  Format ini digunakan oleh
  HTML input type="date".
*/

export function getTodayDate() {

  const today = new Date()

  const year =
    today.getFullYear()

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      today.getDate()
    ).padStart(2, '0')


  return `${year}-${month}-${day}`

}


/*
  Mengubah YYYY-MM-DD
  menjadi DD/MM/YYYY
  untuk tampilan aplikasi.
*/

export function formatDate(dateString) {

  if (!dateString) {
    return ''
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
  Mengubah DD/MM/YYYY
  menjadi YYYY-MM-DD.
*/

export function dateToISO(dateString) {

  if (!dateString) {
    return ''
  }


  const parts =
    dateString.split('/')


  if (parts.length !== 3) {
    return ''
  }


  const [
    day,
    month,
    year
  ] = parts


  if (
    day.length !== 2 ||
    month.length !== 2 ||
    year.length !== 4
  ) {
    return ''
  }


  return `${year}-${month}-${day}`

}


/*
  Mengubah YYYY-MM-DD
  menjadi DD/MM/YYYY.
*/

export function isoToDate(isoDate) {

  return formatDate(isoDate)

}