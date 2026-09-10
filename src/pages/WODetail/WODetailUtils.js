/*
  ==================================================
  ESCAPE HTML
  ==================================================
*/

export function escapeHTML(
  value
) {

  return String(
    value ?? ''
  )
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


/*
  ==================================================
  FORMAT DATE
  ==================================================

  YYYY-MM-DD
  menjadi
  DD/MM/YYYY
*/

export function formatDate(
  dateString
) {

  if (!dateString) {

    return '-'

  }


  const parts =
    dateString.split('-')


  if (
    parts.length !== 3
  ) {

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

export function formatTimestamp(
  timestamp
) {

  if (!timestamp) {

    return '-'

  }


  if (
    typeof timestamp.toDate ===
    'function'
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

export function formatDateTime(
  date
) {

  if (!date) {

    return '-'

  }


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


  return (
    `${day}/${month}/${year} ` +
    `${hours}:${minutes}`
  )

}