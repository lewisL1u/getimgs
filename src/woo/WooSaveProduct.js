import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const wooApi = new WooCommerceRestApi({
  url: process.env.WOO_API_URL, // Your store URL
  consumerKey: process.env.WOO_CONSUMER_KEY, // Your consumer key
  consumerSecret: process.env.WOO_CONSUMER_SECRET, // Your consumer secret
  version: 'wc/v3', // WooCommerce API version
  queryStringAuth: true // Force Basic Authentication as query string here and in all future calls
});

async function addOrUpdateWooCommerceProduct(productData) {
  try {
    // Check if product exists by SKU
    let existingProduct = null;
    if (productData.sku) {
      const { data: products } = await wooApi.get('products', { sku: productData.sku });
      if (products.length > 0) {
        existingProduct = products[0];
      }
    }

    if (existingProduct) {
      // Update existing product
      console.log(`Updating product with SKU: ${productData.sku}, ID: ${existingProduct.id}`);
      const { data } = await wooApi.put(`products/${existingProduct.id}`, productData);
      return { action: 'updated', product: data };
    } else {
      // Create new product
      console.log(`Creating new product with SKU: ${productData.sku}`);
      const { data } = await wooApi.post('products', productData);
      return { action: 'created', product: data };
    }
  } catch (error) {
    console.error('Error adding or updating WooCommerce product:', error.response ? error.response.data : error.message);
    throw error;
  }
}

export { addOrUpdateWooCommerceProduct };
