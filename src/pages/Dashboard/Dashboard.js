export function renderDashboard() {

  return `
    <div class="dashboard">

      <div class="dashboard-cards">

        <div class="dashboard-card">
          <span class="card-label">Total Order</span>
          <strong class="card-value">0</strong>
        </div>

        <div class="dashboard-card">
          <span class="card-label">Back Order</span>
          <strong class="card-value">0</strong>
        </div>

        <div class="dashboard-card">
          <span class="card-label">Supply</span>
          <strong class="card-value">0</strong>
        </div>

        <div class="dashboard-card">
          <span class="card-label">Selesai</span>
          <strong class="card-value">0</strong>
        </div>

      </div>

      <div class="content-card">

        <div class="content-card-header">
          <div>
            <h3>Monitoring Order</h3>
            <p>Data order akan tampil di sini.</p>
          </div>
        </div>

        <div class="empty-state">
          <div class="empty-icon">▤</div>

          <h3>Belum ada data</h3>

          <p>
            Data order akan muncul setelah
            database terhubung.
          </p>
        </div>

      </div>

    </div>
  `
}