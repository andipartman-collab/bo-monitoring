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

          <div class="user-avatar">
            U
          </div>

          <div class="user-info">

            <strong>User</strong>

            <span>Partman</span>

          </div>

        </div>

      </div>

    </header>
  `
}