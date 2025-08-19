import { Component, For } from 'solid-js';
import { Row } from 'shared-data';

interface Props {
  rows: () => Row[];
  onSort(col: keyof Row): void;
}

const DataGrid: Component<Props> = (props) => (
  <table data-test="grid">
    <thead>
      <tr>
        <th data-test="col-product" onClick={() => props.onSort('product')}>Product</th>
        <th data-test="col-region" onClick={() => props.onSort('region')}>Region</th>
        <th data-test="col-price" onClick={() => props.onSort('price')}>Price</th>
        <th data-test="col-qty" onClick={() => props.onSort('qty')}>Qty</th>
        <th data-test="col-updatedAt" onClick={() => props.onSort('updatedAt')}>Updated</th>
      </tr>
    </thead>
    <tbody>
      <For each={props.rows()}>{r => (
        <tr>
          <td>{r.product}</td>
          <td>{r.region}</td>
          <td>{r.price}</td>
          <td>{r.qty}</td>
          <td>{r.updatedAt}</td>
        </tr>
      )}</For>
    </tbody>
  </table>
);
export default DataGrid;
