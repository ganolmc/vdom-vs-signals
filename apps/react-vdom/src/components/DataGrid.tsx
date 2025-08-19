import React from 'react';
import { Row } from 'shared-data';

interface Props {
  rows: Row[];
  onSort(col: keyof Row): void;
}

export default function DataGrid({ rows, onSort }: Props) {
  return (
    <table data-test="grid">
      <thead>
        <tr>
          <th data-test="col-product" onClick={() => onSort('product')}>Product</th>
          <th data-test="col-region" onClick={() => onSort('region')}>Region</th>
          <th data-test="col-price" onClick={() => onSort('price')}>Price</th>
          <th data-test="col-qty" onClick={() => onSort('qty')}>Qty</th>
          <th data-test="col-updatedAt" onClick={() => onSort('updatedAt')}>Updated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.product}</td>
            <td>{r.region}</td>
            <td>{r.price}</td>
            <td>{r.qty}</td>
            <td>{r.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
