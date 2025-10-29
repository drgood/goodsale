
import Dexie, { type Table } from 'dexie';
import type { Product, Sale } from './types';

export class GoodSaleDB extends Dexie {
  products!: Table<Product>;
  offlineSales!: Table<Sale>;

  constructor() {
    super('goodsaleDB');
    this.version(1).stores({
      products: 'id, &sku, name, category, supplier',
      offlineSales: 'id, createdAt'
    });
  }
}

export const db = new GoodSaleDB();

export async function cacheProducts(products: Product[]) {
    try {
        await db.products.clear();
        await db.products.bulkPut(products);
        console.log('Products cached successfully.');
    } catch (error) {
        console.error('Failed to cache products:', error);
    }
}
