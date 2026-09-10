import { saList } from './saList.js'


export function renderNewOrderForm() {

  const saOptions =
    saList
      .map(sa => `
        <option value="${sa}">
          ${sa}
        </option>
      `)
      .join('')


  return `
    <section class="new-order-section">

      <div class="new-order-section-header">

        <div>

          <span class="new-order-section-number">
            01
          </span>

          <div>

            <h2>Informasi WO</h2>

            <p>
              Masukkan informasi Work Order
            </p>

          </div>

        </div>

      </div>


      <div class="new-order-form">


        <!-- NO WO -->

        <div class="form-group">

          <label for="noWo">
            No WO <span>*</span>
          </label>

          <input
            type="text"
            id="noWo"
            name="noWo"
            placeholder="Contoh: WO-2026-0001"
            autocomplete="off"
          />

        </div>


        <!-- SA -->

        <div class="form-group">

          <label for="sa">
            SA <span>*</span>
          </label>

          <select
            id="sa"
            name="sa"
          >

            <option value="">
              Pilih SA
            </option>

            ${saOptions}

          </select>

        </div>


        <!-- CUSTOMER -->

        <div class="form-group">

          <label for="customer">
            Customer <span>*</span>
          </label>

          <input
            type="text"
            id="customer"
            name="customer"
            placeholder="Nama customer"
            autocomplete="off"
          />

        </div>


        <!-- NO POLISI -->

        <div class="form-group">

          <label for="noPolisi">
            No Polisi <span>*</span>
          </label>

          <input
            type="text"
            id="noPolisi"
            name="noPolisi"
            placeholder="Contoh: AD 1234 XX"
            autocomplete="off"
          />

        </div>


        <!-- MODEL -->

        <div class="form-group">

          <label for="model">
            Model <span>*</span>
          </label>

          <input
            type="text"
            id="model"
            name="model"
            placeholder="Contoh: KIJANG INNOVA"
            autocomplete="off"
          />

        </div>


        <!-- TANGGAL BOOKING -->

        <div class="form-group">

          <label for="tanggalBooking">
            Tanggal Booking
          </label>

          <input
            type="date"
            id="tanggalBooking"
            name="tanggalBooking"
          />

        </div>


        <!-- NOTE -->

        <div class="form-group form-group-full">

          <label for="note">
            Note
          </label>

          <textarea
            id="note"
            name="note"
            rows="3"
            placeholder="Catatan tambahan (opsional)"
          ></textarea>

        </div>


      </div>

    </section>
  `
}