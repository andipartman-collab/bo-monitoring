export function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img
            src="/logo%20toyota.png"
            alt="Toyota"
          />
        </div>
        <div class="sidebar-title">
          <strong>SOP</strong>
          <strong>MONITORING</strong>
          <span>Nasmoco Slamet Riyadi</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <a href="#" class="menu-item" data-page="dashboard"><span class="menu-icon">⌂</span><span>Dashboard</span></a>
        <a href="#" class="menu-item" data-page="all-order"><span class="menu-icon">▤</span><span>All Order</span></a>
        <a href="#" class="menu-item" data-page="new-order"><span class="menu-icon">＋</span><span>New Order</span></a>
        <a href="#" class="menu-item" data-page="eta-update"><span class="menu-icon">↻</span><span>Update ETA</span></a>
        <a href="#" class="menu-item" data-page="ata-update"><span class="menu-icon">⇩</span><span>Update ATA</span></a>
        <a href="#" class="menu-item" data-page="monitoring-sa"><span class="menu-icon">👥</span><span>Monitoring by SA</span></a>
        <a href="#" class="menu-item" data-page="notification-center"><span class="menu-icon">🔔</span><span>Notification Center</span></a>
      </nav>

      <div class="sidebar-footer">
        <span>SOP Monitoring v1.0.0</span>
        <small>Developed by :<br />Thoyi Lukman Hakim</small>
      </div>
    </aside>
  `
}
