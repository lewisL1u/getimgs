// Use createRequire to import a CJS module in an ESM file
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

import dotenv from 'dotenv';
dotenv.config();

const WooCommerce = new WooCommerceRestApi({
  url: process.env.WOO_API_URL,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  version: 'wc/v3'
});

const cfg = {
  // Woo
  'woo': {
    'site': process.env.WOO_API_URL,
    'ck': process.env.WOO_CONSUMER_KEY,
    'cs': process.env.WOO_CONSUMER_SECRET,
    'page_limit': 100
  }
}

async function createCategory(name, id, sortOrder, categoryMap) {
  if (!name) {
    name = 'misc';
  }

  let slug = extractAndFormatCategorySlug(name).toLowerCase();
  if (categoryMap.has(slug)) {
    return categoryMap.get(slug);
  }

  if (await getCategoryBySlug(slug, categoryMap)) {
    return categoryMap.get(slug);
  }

  const data = {
    name: name,
    description: JSON.stringify({ id: id, sortOrder: sortOrder, name: name }),
    slug: slug
  };

  try {
    const response = await WooCommerce.post("products/categories", data);
    console.log("Category created successfully:", response.data);

    const res = response.data;
    const cat = { 'id': res.id, 'name': res.name, 'slug': res.slug, 'description': res.description };
    categoryMap.set(slug, cat);
    return cat;
  } catch (error) {
    console.error("Error creating category:", error.response ? error.response.data : error);
    throw error;
  }
}

async function getCategoryBySlug(slug, categoryMap) {
  if (categoryMap.has(slug)) {
    return categoryMap.get(slug);
  }

  try {
    const response = await WooCommerce.get("products/categories?slug=" + slug.toLowerCase());
    if (!response.data || response.data.length === 0) {
      return null;
    }
    const res = response.data[0];
    const cat = { 'id': res.id, 'name': res.name, 'slug': res.slug, 'description': res.description };
    categoryMap.set(slug, cat);
    return cat;
  } catch (error) {
    console.error("Error fetching category by slug:", error.response ? error.response.data : error);
    throw error;
  }
}

function extractAndFormatCategorySlug(categoryName) {
  const parts = categoryName.split('|');
  if (parts.length > 1) {
    const slugPart = parts[1].trim();
    return slugPart.replace(/\s+/g, '_').toLowerCase();
  }
  return categoryName.replace(/\s+/g, '_').toLowerCase(); // Fallback if no '|' found
}

async function getAllCWooCategories() {
  let allCategories = {};
  let page = 1;
  let hasMore = true;
  const limit = cfg.woo.page_limit;

  while (hasMore) {
    const url = `${cfg.woo.site}/wp-json/wc/v3/products/categories?consumer_key=${cfg.woo.ck}&consumer_secret=${cfg.woo.cs}&per_page=${limit}&page=${page}`;

    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WooCommerce API Error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      const categories = await response.json();

      if (categories.length > 0) {
        for (const category of categories) {
          allCategories[category.slug] = category;
        }
      } else {
        // No more categories to fetch
        hasMore = false;
      }

      // If the number of categories returned is less than the limit, we've reached the last page.
      if (categories.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error(`Failed to fetch page ${page} of WooCommerce categories:`, error);
      hasMore = false; // Stop the loop on error
      throw error;
    }
  }

  return allCategories;
}

// Export functions for use in other ESM files
export { createCategory, getAllCWooCategories };