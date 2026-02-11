class WooProductObj {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.dateCreated = data.date_created ? new Date(data.date_created) : null;
    this.dateModified = data.date_modified ? new Date(data.date_modified) : null;
    this.type = 'simple'; // simple, grouped, external, variable
    this.status = 'publish'; // draft, pending, private, publish
    this.featured = false;
    this.catalogVisibility = 'visible'; // visible, catalog, search, hidden
    this.description = data.description || '';
    this.shortDescription = data.short_description || '';
    this.sku = data.sku || '';
    this.price = data.price || '';
    this.regularPrice = data.price || '';
    this.salePrice = data.sale_price || '';
    this.dateOnSaleFrom = data.date_on_sale_from ? new Date(data.date_on_sale_from) : null;
    this.dateOnSaleTo = data.date_on_sale_to ? new Date(data.date_on_sale_to) : null;
    this.onSale = data.on_sale || false;
    this.purchasable = data.purchasable || false;
    this.totalSales = data.total_sales || 0;
    this.virtual = data.virtual || false;
    this.downloadable = data.downloadable || false;
    this.downloads = data.downloads || [];
    this.downloadLimit = data.download_limit || -1;
    this.downloadExpiry = data.download_expiry || -1;
    this.externalUrl = data.external_url || '';
    this.buttonText = data.button_text || '';
    this.taxStatus = data.tax_status || 'taxable'; // taxable, shipping, none
    this.taxClass = data.tax_class || '';
    this.manageStock = data.manage_stock || false;
    this.stockQuantity = data.stock_quantity || null;
    this.stockStatus = data.stock_status || 'instock'; // instock, outofstock, onbackorder
    this.backorders = data.backorders || 'no'; // no, notify, yes
    this.backordersAllowed = data.backorders_allowed || false;
    this.backordered = data.backordered || false;
    this.soldIndividually = data.sold_individually || false;
    this.weight = data.weight || '';
    this.dimensions = {
      length: data.dimensions?.length || '',
      width: data.dimensions?.width || '',
      height: data.dimensions?.height || ''
    };
    this.shippingRequired = data.shipping_required || false;
    this.shippingTaxable = data.shipping_taxable || false;
    this.shippingClass = data.shipping_class || '';
    this.shippingClassId = data.shipping_class_id || 0;
    this.reviewsAllowed = data.reviews_allowed || true;
    this.averageRating = parseFloat(data.average_rating) || 0;
    this.ratingCount = data.rating_count || 0;
    this.relatedIds = data.related_ids || [];
    this.upsellIds = data.upsell_ids || [];
    this.crossSellIds = data.cross_sell_ids || [];
    this.parentId = data.parent_id || 0;
    this.purchaseNote = data.purchase_note || '';
    this.categories = data.categories || []; // [{ id, name, slug }]
    this.tags = data.tags || []; // [{ id, name, slug }]
    this.images = data.images || []; // [{ id, date_created, date_modified, src, name, alt }]
    this.attributes = data.attributes || []; // [{ id, name, position, visible, variation, options }]
    this.defaultAttributes = data.default_attributes || []; // For variable products
    this.variations = data.variations || [];
    this.groupedProducts = data.grouped_products || [];
    this.menuOrder = data.menu_order || 0;
    this.metaData = data.meta_data || []; // [{ id, key, value }]
  }

  // Example method to get a displayable price
  getDisplayPrice() {
    if (this.onSale && this.salePrice) {
      return `Sale! $${this.salePrice}`;
    }
    return `$${this.price}`;
  }

    static fromCloverProduct(cloverProduct) {
    const data = {
      id: cloverProduct.id ? parseInt(cloverProduct.id, 10) : null,
      name: cloverProduct.name || '',
      sku: cloverProduct.sku || '',
      price: cloverToWooPrice(cloverProduct.price),
      sale_price: cloverProduct.salePrice ? cloverToWooPrice(cloverProduct.salePrice) : undefined, // Assuming salePrice might exist on cloverProduct
      description: cloverProduct.description || '',
      short_description: cloverProduct.description || '', // Assuming short_description might map to description from Clover
      stock_quantity: cloverProduct.stockCount !== undefined ? cloverProduct.stockCount : null,
      manage_stock: cloverProduct.stockCount !== undefined,
      status: cloverProduct.active === false ? 'draft' : 'publish',
      catalog_visibility: cloverProduct.hidden === true ? 'hidden' : 'visible',
      // Map categories if cloverProduct has them
      // categories: cloverProduct.productCategory ? [{ id: parseInt(cloverProduct.productCategory.id, 10), name: cloverProduct.productCategory.name, slug: '' }] : [],
      // You may need to map other fields based on your Clover product structure

    };

    // Helper to convert Clover price (cents) to Woo price (decimal string)
    function cloverToWooPrice(cloverPrice) {
      if (typeof cloverPrice === 'number') {
        return (cloverPrice / 100).toFixed(2);
      }
      return '';
    }

    return new WooProductObj(data);
  }


/**
* Converts a Clover product object to a WooCommerce product object format.
*
* @param {object} cloverProduct The product object from the Clover API.
* @param {Map<string, number>} [cloverToWooCategoryMap] Optional map where keys are Clover category IDs 
*   and values are the corresponding WooCommerce category IDs. This is for mapping categories.
* @returns {object} A product object formatted for the WooCommerce REST API.
*/
static convertCloverToWoo(cloverProduct, cloverToWooCategoryMap = new Map()) {

 /**
  * Helper to convert Clover price (in cents) to a WooCommerce price (decimal string).
  * @param {number} cloverPrice Price in cents.
  * @returns {string} Price as a decimal string.
  */
 const cloverToWooPrice = (cloverPrice) => {
   if (typeof cloverPrice === 'number') {
     return (cloverPrice / 100).toFixed(2);
   }
   return '';
 };

 // Map categories from Clover to WooCommerce
 const wooCategories = [];
 if (cloverProduct.categories && cloverProduct.categories.elements) {
   cloverProduct.categories.elements.forEach(cloverCat => {
     if (cloverToWooCategoryMap.has(cloverCat.id)) {
       // If a mapping exists, use the WooCommerce category ID
       wooCategories.push({ id: cloverToWooCategoryMap.get(cloverCat.id) });
     }
     // Note: If no mapping is found, the category is ignored.
     // You could extend this to create new categories in WooCommerce if needed.
   });
 }

 const wooProduct = {
   name: cloverProduct.onlineName || cloverProduct.name,
   type: 'simple',
   status: cloverProduct.available ? 'publish' : 'draft', // 'publish' if available, otherwise 'draft'
   featured: false,
   catalog_visibility: cloverProduct.hidden ? 'hidden' : 'visible',
   description: cloverProduct.description || '',
   short_description: '', // Clover data doesn't have a separate short description
   
   // Use SKU from Clover; if it's empty, use the 'code' (barcode) as a fallback.
   sku: cloverProduct.sku || cloverProduct.code || '',
   
   // Prices
   price: cloverToWooPrice(cloverProduct.price),
   regular_price: cloverToWooPrice(cloverProduct.price),
   sale_price: '', // The provided Clover object does not contain sale price info.

   // Stock management
   manage_stock: cloverProduct.autoManage || false,
   stock_quantity: cloverProduct.stockCount,
   stock_status: cloverProduct.stockCount > 0 ? 'instock' : 'outofstock',
   
   categories: wooCategories,
   
   images: [] // The provided Clover object does not contain image info.
 };

 return wooProduct;
}

/**
 * Creates a map from Clover category IDs to WooCommerce category IDs for categories
 * that have the same name in both systems (case-insensitive).
 *
 * @param {Array<object>} cloverCategories - Array of category objects from Clover (e.g., [{id: 'abc', name: 'Drinks'}]).
 * @param {Array<object>} wooCategories - Array of category objects from WooCommerce (e.g., [{id: 123, name: 'Drinks'}]).
 * @returns {Map<string, number>} A map of matching Clover IDs to WooCommerce IDs.
 */
static createCategoryMapByName(cloverCategories, wooCategories) {
  const categoryMap = new Map();
  // Create a quick lookup map of lowercase names to Woo IDs
  const wooCategoryNameMap = new Map(
    wooCategories.map(cat => [cat.name.toLowerCase(), cat.id])
  );

  for (const cloverCat of cloverCategories) {
    const cloverCatNameLower = cloverCat.name.toLowerCase();
    if (wooCategoryNameMap.has(cloverCatNameLower)) {
      // If a match is found, map the Clover ID to the Woo ID
      const wooCatId = wooCategoryNameMap.get(cloverCatNameLower);
      categoryMap.set(cloverCat.id, wooCatId);
    }
  }

  console.log('Generated Category Map:', categoryMap);
  return categoryMap;
}

// Add more methods as needed for specific business logic
}

export default WooProductObj;
