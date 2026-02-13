import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function uploadImageToWoo(imagePath, imageName, consumerKey, consumerSecret, wooCommerceUrl) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const fileName = path.basename(imageName);
        const fileExtension = path.extname(imagePath).slice(1);

        const data = {
            name: fileName,
            type: fileExtension === 'jpg' ? 'jpeg' : fileExtension,
            file: base64Image
        };

        const response = await axios.post(
            `${wooCommerceUrl}/wp-json/wc/v3/media`,
            data,
            {
                headers: {
                    'Content-Type': 'image/jpeg'
                },
                auth: {
                    username: consumerKey,
                    password: consumerSecret
                }
            }
        );

        console.log('Image uploaded successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error uploading image to WooCommerce:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Example Usage (remove or comment out in production code)
// const imageFilePath = './path/to/your/image.jpg'; // Replace with your image path
// const wooConsumerKey = 'YOUR_CONSUMER_KEY';     // Replace with your WooCommerce Consumer Key
// const wooConsumerSecret = 'YOUR_CONSUMER_SECRET'; // Replace with your WooCommerce Consumer Secret
// const wooCommerceSiteUrl = 'https://yourwordpresssite.com'; // Replace with your WooCommerce site URL

// uploadImageToWoo(imageFilePath, wooConsumerKey, wooConsumerSecret, wooCommerceSiteUrl)
//     .then(imageData => {
//         console.log('WooCommerce Image ID:', imageData.id);
//         console.log('WooCommerce Image URL:', imageData.src);
//     })
//     .catch(err => {
//         console.error('Failed to upload image:', err);
//     });

export { uploadImageToWoo };