import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function uploadImageToWoo(imagePath, imageName, consumerKey, consumerSecret, wooCommerceUrl) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const fileName = path.basename(imageName);
        const fileExtension = path.extname(imagePath).slice(1).toLowerCase();
        
        const contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        const response = await axios.post(
            `${wooCommerceUrl}/wp-json/wp/v2/media`,
            imageBuffer,
            {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${fileName}"`
                },
                auth: {
                    username: consumerKey,
                    password: consumerSecret
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        console.log('Image uploaded successfully:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Error uploading image to WooCommerce:', {
                status: error.response.status,
                headers: error.response.headers,
                data: error.response.data
            });
        } else {
            console.error('Error uploading image to WooCommerce:', error.message);
        }
        throw error;
    }
}

// Example Usage (remove or comment out in production code)
// const imageFilePath = './path/to/your/image.jpg'; // Replace with your image path
// const imageName = 'custom-filename.jpg'; // A name for the file in WordPress
// const wooConsumerKey = 'YOUR_CONSUMER_KEY';     // Replace with your WooCommerce Consumer Key
// const wooConsumerSecret = 'YOUR_CONSUMER_SECRET'; // Replace with your WooCommerce Consumer Secret
// const wooCommerceSiteUrl = 'https://yourwordpresssite.com'; // Replace with your WooCommerce site URL

// uploadImageToWoo(imageFilePath, imageName, wooConsumerKey, wooConsumerSecret, wooCommerceSiteUrl)
//     .then(imageData => {
//         console.log('WooCommerce Image ID:', imageData.id);
//         console.log('WooCommerce Image URL:', imageData.source_url);
//     })
//     .catch(err => {
//         console.error('Failed to upload image:', err);
//     });

export { uploadImageToWoo };
