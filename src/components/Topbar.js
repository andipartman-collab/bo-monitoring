export function renderTopbar(
  title = 'Dashboard',
  subtitle = 'Monitoring Back Order Spare Part'
) {
  return `
    <header class="topbar">

      <div class="topbar-left">

        <h1>${title}</h1>

        <p>${subtitle}</p>

      </div>

      <div class="topbar-right">

        <div class="topbar-user">
          <div class="user-info">
            <strong>${formatLongDate(new Date())}</strong>
          </div>
        </div>

      </div>

    </header>
  `
}

function formatLongDate(date) {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ]

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}
