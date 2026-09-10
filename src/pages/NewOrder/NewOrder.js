import { renderNewOrderForm } from './NewOrderForm.js'

import {
  renderNewOrderParts,
  initNewOrderParts
} from './NewOrderParts.js'

import {
  initUppercaseInputs
} from './NewOrderUtils.js'


export function renderNewOrder() {

  return `
    <div class="new-order-page">

      <form id="new-order-form">

        ${renderNewOrderForm()}

        ${renderNewOrderParts()}


        <div class="new-order-actions">

          <button
            type="button"
            id="cancel-new-order"
            class="btn btn-secondary"
          >
            Batal
          </button>


          <button
            type="submit"
            id="save-new-order"
            class="btn btn-success"
          >
            Simpan Order
          </button>

        </div>

      </form>

    </div>
  `
}


export function initNewOrder() {

  initUppercaseInputs()

  initNewOrderParts()

}