import { createCategory, getAllCWooCategories } from "./src/woo/WooCategory.js";
import { saveSecondBingThumbnail } from "./src/BinGetImage.js";
import { getCloverProducts } from "./src/Clover/GetObjs.js";
import { addOrUpdateWooCommerceProduct } from "./src/woo/WooSaveProduct.js";
import WooProductObj from "./src/woo/WooProductObj.js";
import { uploadImageToWoo } from "./src/woo/WooUploadImg.js";

(async () => {
  try {
    let offset = 1100;
    let limit = 100;
    let hasMore = true;
    const categoryMap = new Map();

    while (hasMore) {
      let productsObj = await getCloverProducts(offset, limit);
      hasMore = productsObj.hasMore;
      offset += limit;
      let products = productsObj.products;

      for (const product of products) {
        try {
          // convert clover product to wooComerce product
          const wooProduct = WooProductObj.convertCloverToWoo(product, categoryMap);
          // get images, upload, call saveSecondBingThumbnail
          const imgPath = await saveSecondBingThumbnail(product.name, product.code);
          const imgInfo = await uploadImageToWoo(imgPath, product.code, process.env.WORDPRESS_USERNAME, process.env.WORDPRESS_PASSWORD, process.env.WOO_API_URL);

          wooProduct.images = [{
            src: imgInfo.link,
            id: imgInfo.id
          }];

          const cat = await createCategory(product.categories.elements[0]?.name, product.categories.elements[0]?.id, product.categories.elements[0]?.sortOrder, categoryMap)
          wooProduct.categories = [cat];

          // save woo product to woocommerce
          addOrUpdateWooCommerceProduct(wooProduct);
        } catch (error) {
          console.error(`Error processing product: ${product.code}`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching all Clover products:', error.message);
  }
  console.log("All products got updated");
})();