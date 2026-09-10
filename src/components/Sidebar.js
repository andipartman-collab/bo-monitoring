export function renderSidebar() {

  return `
    <aside class="sidebar">

      <div class="sidebar-header">

        <div class="sidebar-logo">
          BO
        </div>

        <div class="sidebar-title">
          <strong>BO Monitoring</strong>
          <span>Toyota Spare Part</span>
        </div>

      </div>


      <nav class="sidebar-menu">

        <a
          href="#"
          class="menu-item"
          data-page="dashboard"
        >
          <span class="menu-icon">⌂</span>
          <span>Dashboard</span>
        </a>


        <a
          href="#"
          class="menu-item"
          data-page="all-order"
        >
          <span class="menu-icon">▤</span>
          <span>All Order</span>
        </a>


        <a
          href="#"
          class="menu-item"
          data-page="new-order"
        >
          <span class="menu-icon">＋</span>
          <span>New Order</span>
        </a>


        <a
          href="#"
          class="menu-item"
          data-page="eta-update"
        >
          <span class="menu-icon">↻</span>
          <span>Update ETA</span>
        </a>

      </nav>


      <div class="sidebar-footer">
        <span>BO Monitoring</span>
        <small>v1.0.0</small>
      </div>

    </aside>
  `
}
